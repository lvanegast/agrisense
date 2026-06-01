from enum import StrEnum


class Operator(StrEnum):
    GT = "gt"
    LT = "lt"
    EQ = "eq"
    GTE = "gte"
    LTE = "lte"

    def evaluate(self, value: float, threshold: float) -> bool:
        match self:
            case Operator.GT:
                return value > threshold
            case Operator.LT:
                return value < threshold
            case Operator.EQ:
                return value == threshold
            case Operator.GTE:
                return value >= threshold
            case Operator.LTE:
                return value <= threshold
