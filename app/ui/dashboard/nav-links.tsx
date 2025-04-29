'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';


export default function NavLinks({ links }: { links: Array<any> }) {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        // const LinkIcon = await import(`@heroicons/react/24/outline/${link.icon}`);
        return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex h-[48px] grow items-center justify-center gap-2 rounded-md p-3 text-sm font-medium md:flex-none md:justify-start md:p-2 md:px-3 ${
                pathname === link.href
                ? 'bg-sky-100 text-blue-600'
                : 'bg-gray-50 hover:bg-sky-100 hover:text-blue-600'
              }`}
            >
            {/* <LinkIcon className="w-6" /> */}
            <p className="hidden md:block">{link.name}</p>
            </Link>
        );
      })}
    </>
  );
}
