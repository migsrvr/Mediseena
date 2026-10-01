import heroIllustration from '../../assets/hero_illustration.png'
import decoGroup43 from '../../assets/deco_group43.svg'
import decoGroup44 from '../../assets/deco_group44.svg'
import homeSvg02 from '../../assets/home_svg_02.svg'
import homeSvg07 from '../../assets/home_svg_07.svg'
import homeSvg08 from '../../assets/home_svg_08.svg'
import homeSvg10 from '../../assets/home_svg_10.svg'
import homeSvg11 from '../../assets/home_svg_11.svg'
import homeSvg13 from '../../assets/home_svg_13.svg'
import homeSvg16 from '../../assets/home_svg_16.svg'
import pageSvg11 from '../../assets/page_svg_11.svg'

export default function Hero() {
  return (
    <section id="home" className="relative w-full overflow-hidden py-6 lg:py-10">
      {/* Decorative Background Icons */}
      <img
        src={decoGroup43}
        alt=""
        className="pointer-events-none absolute -left-6 top-0 w-60 opacity-80"
      />
      <img
        src={homeSvg13}
        alt=""
        className="pointer-events-none absolute left-6 top-16 w-14 lg:w-16"
      />
      <img
        src={homeSvg02}
        alt=""
        className="pointer-events-none absolute left-4 top-1/2 w-12 -translate-y-1/2 lg:w-16"
      />
      <img
        src={homeSvg11}
        alt=""
        className="pointer-events-none absolute bottom-4 left-8 w-12 lg:w-16"
      />

      <img
        src={decoGroup44}
        alt=""
        className="pointer-events-none absolute -right-6 top-10 w-60 opacity-80"
      />
      <img
        src={pageSvg11}
        alt=""
        className="pointer-events-none absolute right-4 top-6 w-40 lg:w-52"
      />
      <img
        src={homeSvg08}
        alt=""
        className="pointer-events-none absolute right-6 top-36 w-32 lg:w-44"
      />
      <img
        src={homeSvg10}
        alt=""
        className="pointer-events-none absolute right-14 top-28 w-12"
      />
      <img
        src={homeSvg16}
        alt=""
        className="pointer-events-none absolute right-4 top-1/2 w-14 -translate-y-1/2 lg:w-18"
      />
      <img
        src={homeSvg07}
        alt=""
        className="pointer-events-none absolute bottom-4 right-10 w-14 lg:w-18"
      />

      {/* Main Hero Card */}
      <div className="relative mx-auto max-w-[1360px] px-6">
        <div className="relative rounded-[32px] bg-teal px-8 py-10 shadow-[0_12px_36px_rgba(0,0,0,0.12)] sm:px-12 sm:py-14 lg:rounded-[40px] lg:px-16 lg:py-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Left Content */}
            <div className="flex flex-col items-start text-left lg:col-span-7">
              <h1 className="font-poppins text-3xl font-bold leading-[1.22] text-white sm:text-4xl lg:text-[45px]">
                Centralized Digital Platform for Structured Prescription Digitization
              </h1>

              <div className="my-5 h-2 w-36 rounded-full bg-teal-deep" />

              <p className="font-poppins text-base font-normal leading-relaxed text-white sm:text-lg lg:text-[19px]">
                Mediseena is a centralized digital platform that converts handwritten prescriptions into
                organized, secure, and accessible digital records for better healthcare.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center rounded-[14px] bg-teal-deep px-9 py-3.5 font-poppins text-xl font-medium text-white shadow-md transition-transform hover:scale-105 active:scale-95 no-underline"
                >
                  Get Started
                </a>
                <a
                  href="/upload"
                  className="inline-flex items-center justify-center rounded-[14px] bg-white px-7 py-3.5 font-poppins text-base font-bold text-teal-deep shadow-md transition-transform hover:scale-105 active:scale-95 no-underline"
                >
                  Scan Prescription →
                </a>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="flex items-center justify-center lg:col-span-5">
              <img
                src={heroIllustration}
                alt="Prescription digitization illustration"
                className="w-full max-w-[500px] object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}