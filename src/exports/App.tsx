import { CheckoutPage } from "../pages/CheckoutPage";
import { ConfirmationPage } from "../pages/ConfirmationPage";
import { OrderPage } from "../pages/OrderPage";
import { useLocalStorage } from "../lib/useLocalStorage";
import type { Cart, PlacedOrder } from "../data/types";

type View =
  | { name: "order" }
  | { name: "checkout" }
  | { name: "confirmed"; order: PlacedOrder };

export default function FullOrderPage() {
  const [cart, setCart] = useLocalStorage<Cart>("smitbite:cart", {});
  const [view, setView] = useLocalStorage<View>("smitbite:view", {
    name: "order",
  });

  const setQuantity = (id: string, qty: number) =>
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

  const go = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <button
            onClick={() => go({ name: "order" })}
            className="text-xl font-bold tracking-tight"
          >
            SmitBite
          </button>
          <Steps current={view.name} />
        </div>
      </header>

      {view.name === "order" && (
        <OrderPage
          cart={cart}
          setQuantity={setQuantity}
          onCheckout={() => go({ name: "checkout" })}
        />
      )}
      {view.name === "checkout" && (
        <CheckoutPage
          cart={cart}
          onBack={() => go({ name: "order" })}
          onPaid={(order) => {
            setCart({});
            go({ name: "confirmed", order });
          }}
        />
      )}
      {view.name === "confirmed" && (
        <ConfirmationPage
          order={view.order}
          onNewOrder={() => go({ name: "order" })}
        />
      )}
    </div>
  );
}

const STEPS = [
  { key: "order", label: "Order" },
  { key: "checkout", label: "Checkout" },
  { key: "confirmed", label: "Done" },
] as const;

function Steps({ current }: { current: View["name"] }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="hidden items-center gap-2 text-sm sm:flex">
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
              i <= idx
                ? "bg-amber-500 text-white"
                : "bg-stone-200 text-stone-500"
            }`}
          >
            {i + 1}
          </span>
          <span className={i === idx ? "font-semibold" : "text-stone-500"}>
            {s.label}
          </span>
          {i < STEPS.length - 1 && (
            <span className="mx-1 h-px w-6 bg-stone-300" />
          )}
        </li>
      ))}
    </ol>
  );
}
