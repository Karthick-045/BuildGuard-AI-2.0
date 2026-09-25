from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class BuildingSensor(Base):
    __tablename__ = "building_sensors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    sensor_id = Column(String(100), nullable=False, index=True)
    sensor_type = Column(String(50), nullable=False)  # SMOKE, TEMPERATURE, DOOR_CONTACT, OCCUPANCY, CO2
    element_label = Column(String(100), nullable=False)  # Room B, Corridor C, Exit Door B, etc.
    location = Column(String(100), nullable=False)
    status = Column(String(50), default="NORMAL")  # NORMAL, WARNING, CRITICAL_ALERT, OFFLINE
    current_value = Column(Float, default=0.0)
    unit = Column(String(20), default="")  # °C, ppm, people, state
    threshold = Column(Float, default=0.0)
    battery_level = Column(Integer, default=95)
    last_reading = Column(DateTime, default=datetime.utcnow)
    alert_message = Column(String(255), nullable=True)

    # Relationship
    project = relationship("Project", back_populates="sensors")
