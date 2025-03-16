// Array indicating the tags that must *all* be selected for this packable to be included.
type Inclusion = ReadonlyArray<string>;

interface Packable {
  name: string;
  // Array of inclusions, for *any* of which this packable will be included.
  inclusions: ReadonlyArray<Inclusion>;
}

interface PackablesGroup {
  name: string;
  packables: ReadonlyArray<Packable>;
}

interface ToPackGroup {
  name: string;
  toPack: ReadonlyArray<string>;
}
