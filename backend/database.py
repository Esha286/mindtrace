from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker

engine = create_engine("sqlite:///mindtrace.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class Recording(Base):
    __tablename__ = "recordings"
    id = Column(Integer, primary_key=True)
    filename = Column(String)
    transcript = Column(Text)
    created_at = Column(DateTime, default=datetime.now)


class Segment(Base):
    __tablename__ = "segments"
    id = Column(Integer, primary_key=True)
    recording_id = Column(Integer, ForeignKey("recordings.id"))
    title = Column(String)
    start_time = Column(Float)
    end_time = Column(Float)
    question = Column(Text)
    options = Column(Text)  # 4 options saved as a JSON text
    correct_answer = Column(String)


class Response(Base):
    __tablename__ = "responses"
    id = Column(Integer, primary_key=True)
    segment_id = Column(Integer, ForeignKey("segments.id"))
    selected_answer = Column(String)
    is_correct = Column(Boolean)
    created_at = Column(DateTime, default=datetime.now)


class Flag(Base):
    __tablename__ = "flags"
    id = Column(Integer, primary_key=True)
    segment_id = Column(Integer, ForeignKey("segments.id"))
    created_at = Column(DateTime, default=datetime.now)


class ReplayEvent(Base):
    __tablename__ = "replay_events"
    id = Column(Integer, primary_key=True)
    segment_id = Column(Integer, ForeignKey("segments.id"))
    created_at = Column(DateTime, default=datetime.now)