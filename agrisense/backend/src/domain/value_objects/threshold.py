from dataclasses import dataclass

from .operator import Operator


@dataclass(frozen=True)
class Threshold:
    value: float
    operator: Operator

    def is_exceeded(self, reading_value: float) -> bool:
        return self.operator.evaluate(reading_value, self.value)
