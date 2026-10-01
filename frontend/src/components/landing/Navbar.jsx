import logo from '../../assets/logo.png'

const links = [
  { label: 'Home', href: '#home', active: true },
  { label: 'About', href: '#about' },
  { label: 'Login', href: '/login' },
]

export default function Navbar() {
  return (
    <header className="w-full bg-white">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between px-6 py-6 lg:py-8">
        {/* Brand */}
        <a href="#home" className="flex items-center gap-3 no-underline">
          <div className="relative h-14 w-20 shrink-0 overflow-hidden">
            <img
              src={logo}
              alt="Mediseena"
              className="absolute max-w-none"
              style={{
                top: '-34%',
                left: '-67%',
                width: '232%',
                height: '252%',
              }}
            />
          </div>
          <span className="font-poppins text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-teal">Medi</span>
            <span className="text-teal-deep">seen</span>
            <span className="text-teal">a</span>
          </span>
        </a>

        {/* Navigation */}
        <nav className="flex items-center gap-6 sm:gap-8 font-poppins text-sm sm:text-base font-medium">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`relative pb-1 tracking-wide no-underline transition-colors hover:text-teal ${
                link.active ? 'font-semibold text-black' : 'text-gray-800'
              }`}
            >
              {link.label}
              {link.active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-teal" />
              )}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}