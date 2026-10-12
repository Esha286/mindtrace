import json
import os
import shutil
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from groq import Groq
from pydantic import BaseModel
from sqlalchemy import inspect
from database import (
    Base, engine, SessionLocal,
    Recording, Segment, Response, Flag, ReplayEvent,
)

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MindTrace API")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_SIZE = 25 * 1024 * 1024  # Groq ki limit 25 MB

PROMPT = """You are a teacher. Below is a lecture transcript. Each line looks like [start-end] text, in seconds.
Split the lecture into 2 to 5 topic segments. For each segment write ONE multiple choice question with 4 options that checks understanding.
Rules:
- The question must be clear, complete and make sense on its own.
- Options are plain text only. Do NOT write A., B., C. or D. inside the option text.
- correct_answer is one letter (A, B, C or D) for the position of the right option.
- Spread the correct answers across A, B, C and D. Do not always use the same letter.
- Use start and end times from the transcript.
Return ONLY JSON in exactly this format:
{"segments": [{"title": "...", "start_time": 0.0, "end_time": 10.0, "question": "...", "options": ["...", "...", "...", "..."], "correct_answer": "A"}]}

Transcript:
"""


class Answer(BaseModel):
    segment_id: int
    selected_answer: str  # A, B, C ya D


def get_value(item, key):
    # segment kabhi dict hota hai, kabhi object
    if isinstance(item, dict):
        return item[key]
    return getattr(item, key)


def check_segment(db, segment_id):
    segment = db.query(Segment).filter(Segment.id == segment_id).first()
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    return segment


@app.get("/")
def home():
    return {"message": "MindTrace backend is running"}


@app.get("/tables")
def tables():
    return inspect(engine).get_table_names()


@app.post("/upload")
def upload(file: UploadFile = File(...)):
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{stamp}_{os.path.basename(file.filename)}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    db = SessionLocal()
    recording = Recording(filename=filename)
    db.add(recording)
    db.commit()
    db.refresh(recording)
    db.close()

    return {"id": recording.id, "filename": filename}


@app.post("/transcribe/{recording_id}")
def transcribe(recording_id: int):
    db = SessionLocal()
    try:
        recording = db.query(Recording).filter(Recording.id == recording_id).first()
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")

        path = os.path.join(UPLOAD_DIR, recording.filename)
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="File not found in uploads")

        if os.path.getsize(path) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="File is bigger than 25 MB")

        with open(path, "rb") as f:
            result = client.audio.transcriptions.create(
                file=(recording.filename, f.read()),
                model="whisper-large-v3-turbo",
                response_format="verbose_json",
            )

        # har line ka format: [start-end] text
        lines = []
        for seg in result.segments:
            start = get_value(seg, "start")
            end = get_value(seg, "end")
            text = get_value(seg, "text").strip()
            lines.append(f"[{start:.1f}-{end:.1f}] {text}")

        transcript = "\n".join(lines)
        recording.transcript = transcript
        db.commit()
        return {"id": recording.id, "transcript": transcript}
    finally:
        db.close()


@app.post("/generate/{recording_id}")
def generate(recording_id: int):
    db = SessionLocal()
    try:
        recording = db.query(Recording).filter(Recording.id == recording_id).first()
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")
        if not recording.transcript:
            raise HTTPException(status_code=400, detail="Run /transcribe first")

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[{"role": "user", "content": PROMPT + recording.transcript}],
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content)

        # dobara run karne par purane segments hata do
        db.query(Segment).filter(Segment.recording_id == recording_id).delete()

        for s in data["segments"]:
            db.add(Segment(
                recording_id=recording_id,
                title=s["title"],
                start_time=float(s["start_time"]),
                end_time=float(s["end_time"]),
                question=s["question"],
                options=json.dumps(s["options"]),
                correct_answer=s["correct_answer"],
            ))
        db.commit()
        return data
    finally:
        db.close()


@app.get("/segments/{recording_id}")
def get_segments(recording_id: int):
    db = SessionLocal()
    try:
        rows = (
            db.query(Segment)
            .filter(Segment.recording_id == recording_id)
            .order_by(Segment.start_time)
            .all()
        )
        return [
            {
                "id": r.id,
                "title": r.title,
                "start_time": r.start_time,
                "end_time": r.end_time,
                "question": r.question,
                "options": json.loads(r.options),
                "correct_answer": r.correct_answer,
            }
            for r in rows
        ]
    finally:
        db.close()


@app.post("/answer")
def answer(body: Answer):
    db = SessionLocal()
    try:
        segment = check_segment(db, body.segment_id)

        selected = body.selected_answer.strip().upper()
        if selected not in ["A", "B", "C", "D"]:
            raise HTTPException(status_code=400, detail="Answer must be A, B, C or D")

        is_correct = selected == segment.correct_answer

        db.add(Response(
            segment_id=segment.id,
            selected_answer=selected,
            is_correct=is_correct,
        ))
        db.commit()

        return {
            "segment_id": segment.id,
            "selected_answer": selected,
            "is_correct": is_correct,
            "correct_answer": segment.correct_answer,
        }
    finally:
        db.close()


@app.post("/flag/{segment_id}")
def flag(segment_id: int):
    db = SessionLocal()
    try:
        segment = check_segment(db, segment_id)
        db.add(Flag(segment_id=segment.id))
        db.commit()
        return {"segment_id": segment.id, "flagged": True}
    finally:
        db.close()


@app.post("/replay/{segment_id}")
def replay(segment_id: int):
    db = SessionLocal()
    try:
        segment = check_segment(db, segment_id)
        db.add(ReplayEvent(segment_id=segment.id))
        db.commit()
        return {"segment_id": segment.id, "replayed": True}
    finally:
        db.close()


@app.get("/report/{recording_id}")
def report(recording_id: int):
    db = SessionLocal()
    try:
        recording = db.query(Recording).filter(Recording.id == recording_id).first()
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")

        segments = (
            db.query(Segment)
            .filter(Segment.recording_id == recording_id)
            .order_by(Segment.start_time)
            .all()
        )

        result = []
        for s in segments:
            answers = db.query(Response).filter(Response.segment_id == s.id)
            correct = answers.filter(Response.is_correct == True).count()
            wrong = answers.filter(Response.is_correct == False).count()
            flags = db.query(Flag).filter(Flag.segment_id == s.id).count()
            replays = db.query(ReplayEvent).filter(ReplayEvent.segment_id == s.id).count()

            result.append({
                "segment_id": s.id,
                "title": s.title,
                "start_time": s.start_time,
                "end_time": s.end_time,
                "correct": correct,
                "wrong": wrong,
                "flags": flags,
                "replays": replays,
                # simple rule: ek bhi galat jawab ya flag ho to review chahiye
                "needs_review": wrong > 0 or flags > 0,
            })

        return {"recording_id": recording_id, "segments": result}
    finally:
        db.close()