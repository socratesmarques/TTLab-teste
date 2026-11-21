import { optimize } from "./model";
self.onmessage = ({ data }) =>
  self.postMessage(optimize(data.origin, data.criteria));
