import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#2a2a2a] bg-[#1a1a1a] text-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold tracking-tight">
              TavernCreative
            </h3>
            <p className="mt-2 text-sm text-white/60 max-w-sm">
              Beautiful wedding stationery, personalised to perfection.
              From save the dates to thank you cards.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/collections"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Collections
                </Link>
              </li>
              <li>
                <Link
                  href="/shop/save-the-dates"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Save the Dates
                </Link>
              </li>
              <li>
                <Link
                  href="/shop/invitations"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Invitations
                </Link>
              </li>
              <li>
                <Link
                  href="/shop/on-the-day"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  On the Day
                </Link>
              </li>
              <li>
                <Link
                  href="/shop/thank-yous"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Thank You Cards
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Help</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Shipping
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[#2a2a2a]">
          <p className="text-xs text-white/40 text-center">
            &copy; {new Date().getFullYear()} TavernCreative. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
