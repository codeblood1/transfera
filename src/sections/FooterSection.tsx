import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';

const footerLinks = {
  Product: ['Features', 'Pricing', 'Security', 'API'],
  Company: ['About', 'Careers', 'Press', 'Blog'],
  Resources: ['Help Center', 'Contact', 'Status', 'Community'],
  Legal: ['Privacy', 'Terms', 'Compliance', 'Licenses'],
};

export default function FooterSection() {
  return (
    <footer className="bg-deep-blue border-t border-[rgba(245,245,240,0.1)] pt-16 pb-8">
      <div className="content-max container-padding">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-soft-amber flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-deep-blue" />
              </div>
              <span className="text-lg font-medium text-[#F5F5F0]">Transfera</span>
            </Link>
            <p className="text-sm text-[rgba(245,245,240,0.45)] mt-3 max-w-[200px]">
              Secure, fast international transfers for everyone.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-xs font-medium tracking-[0.12em] uppercase text-[#F5F5F0] mb-4">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link}>
                    <span className="text-sm text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0] transition-colors cursor-pointer">
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-12 pt-6 border-t border-[rgba(245,245,240,0.1)]">
          <p className="text-sm text-[rgba(245,245,240,0.35)]">
            &copy; 2025 Transfera. All rights reserved.
          </p>
          <div className="flex items-center gap-5 mt-4 sm:mt-0">
            {['Twitter', 'LinkedIn', 'Instagram', 'GitHub'].map(social => (
              <span key={social} className="text-sm text-[rgba(245,245,240,0.35)] hover:text-[#F5F5F0] transition-colors cursor-pointer">
                {social}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
