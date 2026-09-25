from typing import Any, Dict

def serialize_for_json(data: Any) -> Any:
    """
    Ensures nested lists, dicts, or scalars are JSON serializable.
    """
    if isinstance(data, dict):
        return {k: serialize_for_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [serialize_for_json(i) for i in data]
    return data
