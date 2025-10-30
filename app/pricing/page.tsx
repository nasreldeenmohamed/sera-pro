"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PurchaseButton } from "@/components/payments/PurchaseButtons";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useLocale } from "@/lib/locale-context";

// EGP subscription plans, ready to connect with Kashier checkout
// Uses shared SiteLayout for consistent header/footer
export default function PricingPage() {
  const { t } = useLocale();
  
  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl p-6 sm:p-8 md:p-12">
        <h1 className="text-2xl font-semibold">Pricing - الأسعار (EGP)</h1>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Starter", price: 99, features: ["1 CV", "Basic templates"] },
            { name: "Pro", price: 199, features: ["3 CVs", "Pro templates", "Priority AI"] },
            { name: "Business", price: 399, features: ["Unlimited CVs", "All templates", "Team support"] },
          ].map((plan) => (
            <div key={plan.name} className="rounded-lg border p-5">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold">EGP {plan.price}</p>
              <ul className="mt-4 list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {/* Replace with real checkout wiring; keeping legacy link for Starter */}
              {plan.name === "Starter" ? (
                <Button asChild className="mt-6 w-full">
                  <Link href={`/api/payments/kashier/checkout?plan=${plan.name.toLowerCase()}`}>Checkout with Kashier</Link>
                </Button>
              ) : plan.name === "Pro" ? (
                <div className="mt-6"><PurchaseButton product="one_time" /></div>
              ) : (
                <div className="mt-6"><PurchaseButton product="annual_pass" /></div>
              )}
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}


