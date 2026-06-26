import { Mppx, tempo } from "mppx/nextjs";

function createServerMppx() {
  return Mppx.create({
    secretKey: process.env.MPP_SECRET_KEY!,
    methods: [
      tempo.charge({
        currency: process.env.MPP_CURRENCY as `0x${string}`,
        recipient: process.env.MPP_RECIPIENT as `0x${string}`,
      }),
    ],
  });
}

type ServerMppx = ReturnType<typeof createServerMppx>;

let cached: ServerMppx | null = null;

export function getMppx(): ServerMppx {
  if (cached) {
    return cached;
  }

  cached = createServerMppx();
  return cached;
}

/** Lazy alias — defers Mppx.create until the payment gate runs. */
export const mppx = {
  get charge() {
    return getMppx().charge;
  },
};
