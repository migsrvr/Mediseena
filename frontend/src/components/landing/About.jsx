import pageSvg01 from '../../assets/page_svg_01.svg'
import pageSvg18 from '../../assets/page_svg_18.svg'
import pageSvg19 from '../../assets/page_svg_19.svg'
import decoGroup42 from '../../assets/deco_group42.svg'

export default function About() {
  return (
    <section id="about" className="relative w-full overflow-hidden pt-12 pb-6">
      {/* Decorative Background Icons */}
      <img
        src={decoGroup42}
        alt=""
        className="pointer-events-none absolute -left-10 top-16 w-36 opacity-70"
      />
      <img
        src={pageSvg01}
        alt=""
        className="pointer-events-none absolute left-8 top-4 w-14 lg:w-18"
      />
      <img
        src={pageSvg19}
        alt=""
        className="pointer-events-none absolute right-12 top-4 w-16 lg:w-20"
      />
      <img
        src={pageSvg18}
        alt=""
        className="pointer-events-none absolute right-1/4 top-16 w-20 opacity-60"
      />

      {/* Heading Container */}
      <div className="mx-auto max-w-[1360px] px-6 mb-6">
        <h2 className="font-poppins text-4xl font-bold tracking-tight text-teal sm:text-[46px]">
          ABOUT
        </h2>
        <div className="mt-2 h-2 w-28 rounded-full bg-teal-deep" />
      </div>

      {/* Full-width Teal Banner */}
      <div className="w-full bg-teal py-10 sm:py-12 lg:py-14 shadow-sm">
        <div className="mx-auto max-w-[1360px] px-6">
          <p className="font-poppins text-lg font-medium leading-relaxed text-white sm:text-xl lg:text-[21px] max-w-[1180px]">
            Mediseena is a centralized digital platform designed to digitize handwritten
            prescriptions. Using OCR technology, it extracts and structures prescription information
            into organized, secure, and easily accessible digital records, reducing misinterpretation
            and improving efficiency in healthcare management.
          </p>
        </div>
      </div>
    </section>
  )
}