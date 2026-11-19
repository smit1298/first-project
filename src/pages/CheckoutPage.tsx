import { useMemo, useState, type FormEvent } from "react";
import { PaymentModal } from "../components/PaymentModal";
import { cartLines, cartTotals, formatMoney } from "../lib/cart";
import { useLocalStorage } from "../lib/useLocalStorage";
import type { Cart, CustomerDetails, PlacedOrder } from "../data/types";

type Props = {
  cart: Cart;
  onBack: () => void;
  onPaid: (order: PlacedOrder) => void;
};

const EMPTY: CustomerDetails = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  notes: "",
  fulfilment: "delivery",
};

type Errors = Partial<Record<keyof CustomerDetails, string>>;

function validate(d: CustomerDetails): Errors {
  const e: Errors = {};
  if (!d.fullName.trim()) e.fullName = "Enter your name";
  if (!/^\S+@\S+\.\S+$/.test(d.email)) e.email = "Enter a valid email";
  if (d.phone.replace(/\D/g, "").length < 7)
    e.phone = "Enter a valid phone number";
  if (d.fulfilment === "delivery") {
    if (!d.address.trim()) e.address = "Enter a delivery address";
    if (!d.city.trim()) e.city = "Enter a city";
  }
  return e;
}

export function CheckoutPage({ cart, onBack, onPaid }: Props) {
  const [details, setDetails] = useLocalStorage<CustomerDetails>(
    "smitbite:customer",
    EMPTY,
  );
  const [errors, setErrors] = useState<Errors>({});
  const [paying, setPaying] = useState(false);

  const lines = useMemo(() => cartLines(cart), [cart]);
  const totals = cartTotals(lines, details.fulfilment);

  const update = <K extends keyof CustomerDetails>(
    key: K,
    value: CustomerDetails[K],
  ) => {
    setDetails((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(details);
    setErrors(found);
    if (Object.keys(found).length === 0) setPaying(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <button
        onClick={onBack}
        className="text-sm font-medium text-stone-600 hover:text-stone-900"
      >
        ← Back to menu
      </button>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Checkout</h1>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]"
      >
        <div className="space-y-6">
          <fieldset className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <legend className="sr-only">Fulfilment</legend>
            <h2 className="text-lg font-semibold">How do you want it?</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(["delivery", "pickup"] as const).map((f) => (
                <label
                  key={f}
                  className={`cursor-pointer rounded-xl p-4 ring-1 transition ${
                    details.fulfilment === f
                      ? "bg-amber-50 ring-2 ring-amber-500"
                      : "ring-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="fulfilment"
                    value={f}
                    checked={details.fulfilment === f}
                    onChange={() => update("fulfilment", f)}
                    className="sr-only"
                  />
                  <span className="block font-semibold capitalize">{f}</span>
                  <span className="text-sm text-stone-500">
                    {f === "delivery"
                      ? `${formatMoney(2.99)} · 30–45 min`
                      : "Free · ready in 15 min"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <h2 className="text-lg font-semibold">Contact details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Full name"
                error={errors.fullName}
                className="sm:col-span-2"
              >
                <input
                  value={details.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  autoComplete="name"
                />
              </Field>
              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  value={details.email}
                  onChange={(e) => update("email", e.target.value)}
                  autoComplete="email"
                />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <input
                  type="tel"
                  value={details.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  autoComplete="tel"
                />
              </Field>
            </div>
          </section>

          {details.fulfilment === "delivery" && (
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
              <h2 className="text-lg font-semibold">Delivery address</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Street address"
                  error={errors.address}
                  className="sm:col-span-2"
                >
                  <input
                    value={details.address}
                    onChange={(e) => update("address", e.target.value)}
                    autoComplete="street-address"
                  />
                </Field>
                <Field label="City" error={errors.city}>
                  <input
                    value={details.city}
                    onChange={(e) => update("city", e.target.value)}
                    autoComplete="address-level2"
                  />
                </Field>
                <Field
                  label="Notes for the driver (optional)"
                  className="sm:col-span-2"
                >
                  <textarea
                    rows={2}
                    value={details.notes}
                    onChange={(e) => update("notes", e.target.value)}
                  />
                </Field>
              </div>
            </section>
          )}
        </div>

        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 lg:sticky lg:top-8">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3 text-sm">
                <span>
                  <span className="font-medium">{l.quantity}×</span> {l.name}
                </span>
                <span className="tabular-nums">{formatMoney(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-stone-200 pt-4 text-sm">
            <Row label="Subtotal" value={totals.subtotal} />
            <Row label="Delivery" value={totals.delivery} />
            <Row label="Tax (8%)" value={totals.tax} />
            <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(totals.total)}</dd>
            </div>
          </dl>
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600"
          >
            Pay {formatMoney(totals.total)}
          </button>
          <p className="mt-3 text-center text-xs text-stone-500">
            Demo only — no real payment is taken.
          </p>
        </aside>
      </form>

      {paying && (
        <PaymentModal
          amount={totals.total}
          onClose={() => setPaying(false)}
          onSuccess={(cardLast4) =>
            onPaid({
              id: `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
              lines,
              total: totals.total,
              customer: details,
              cardLast4,
            })
          }
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-stone-600">
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatMoney(value)}</dd>
    </div>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactElement;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <div
        className={`mt-1 [&>*]:w-full [&>*]:rounded-lg [&>*]:border [&>*]:bg-white [&>*]:px-3 [&>*]:py-2 [&>*]:outline-none [&>*]:focus:ring-2 ${
          error
            ? "[&>*]:border-red-400 [&>*]:focus:ring-red-200"
            : "[&>*]:border-stone-300 [&>*]:focus:border-amber-500 [&>*]:focus:ring-amber-200"
        }`}
      >
        {children}
      </div>
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}
