export type Range<
  Start extends number,
  End extends number,
  Acc extends number[] = []
> = Acc["length"] extends End
  ? Acc[number] | End
  : Range<Start, End, [...Acc, Acc["length"]]>;

export type UNSIGNED_SHORT = Range<1, 11>;
