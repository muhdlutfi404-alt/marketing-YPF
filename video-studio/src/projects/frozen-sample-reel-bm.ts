/**
 * EXAMPLE PROJECT — a Bahasa Malaysia vertical Reel for YaPakCik Frozen,
 * using a real B-roll clip for the lifestyle scene and a shorter running time.
 *
 * ⚠️ Please proof-read the copy below before publishing.
 * Run `npm run samples` + `npm run prepare-footage` first so the sample clip exists.
 */
import { frozenCommercialDefaults, type FrozenCommercialProps } from "../brands/yapakcik-frozen/templates/FrozenCommercial";

export const frozenSampleReelBM: FrozenCommercialProps = {
  ...frozenCommercialDefaults,
  hook: { lines: ["LAPAR?", "TAK SEMPAT MASAK?"], punchline: "YAPAKCIK ADA!" },
  product: { ...frozenCommercialDefaults.product, name: "Nugget Ayam Rangup", category: "Rangkaian premium beku", badge: "BARU!" },
  features: {
    heading: "KENAPA KELUARGA SUKA",
    items: [
      { icon: "snowflake", title: "Beku segar", text: "Dikunci pada -18°C" },
      { icon: "clock", title: "Siap 8 minit", text: "Kuali, air fryer atau oven" },
      { icon: "shield", title: "Halal", text: "Kualiti terjamin" },
      { icon: "heart", title: "Anak-anak suka", text: "Rangup di luar, lembut di dalam" },
    ],
  },
  lifestyle: { headline: "Makan malam siap cepat", clip: { src: "footage/ready/sample-kitchen.mp4", trimBeforeSec: 0 } },
  temperature: { ...frozenCommercialDefaults.temperature, caption: "Dibekukan ketika paling segar" },
  comparison: {
    heading: "Lebih cepat dari delivery",
    unit: "minit",
    items: [
      { label: "YaPakCik Frozen", value: 8, highlight: true },
      { label: "Masak sendiri", value: 40 },
      { label: "Pesan delivery", value: 45 },
    ],
  },
  steps: {
    heading: "Semudah 1-2-3",
    items: [
      { title: "Panaskan", caption: "Air fryer 180°C" },
      { title: "Masak", caption: "8 minit, terbalikkan sekali" },
      { title: "Nikmati", caption: "Hidang dengan sos kegemaran" },
    ],
  },
  price: { ...frozenCommercialDefaults.price, unitLabel: "setiap pek 500g", note: "Promosi masa terhad" },
  cta: { headline: "Dapatkan hari ini", buttonText: "Order sekarang", contactLines: ["WhatsApp: 01X-XXX XXXX", "@your.handle"] },
  // shorter cut for Reels: skip the comparison chart
  timing: { ...frozenCommercialDefaults.timing, comparisonSec: 0 },
  captions: [{ text: "Lapar? Tak sempat masak?", startSec: 0.2, endSec: 2.8 }],
};
