import contactIllustration from '../../assets/contact_illustration.png'
import pageSvg13 from '../../assets/page_svg_13.svg'

export default function Contact() {
  return (
    <section id="contact" className="relative w-full bg-teal-light py-16 lg:py-20 shadow-[0_-4px_20px_rgba(6,78,92,0.1)] overflow-hidden">
      <img
        src={pageSvg13}
        alt=""
        className="pointer-events-none absolute right-8 top-12 w-16 opacity-60"
      />

      <div className="mx-auto max-w-[1360px] px-6">
        <h2 className="mb-8 font-poppins text-3xl sm:text-4xl lg:text-[46px] font-bold text-teal-deep">
          Contact Us
        </h2>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Form */}
          <form
            className="flex flex-col gap-4 lg:col-span-6 max-w-[560px]"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="text"
              placeholder="First name"
              className="w-full rounded-lg border-2 border-teal/25 bg-white px-5 py-3.5 font-poppins text-base font-medium text-black placeholder:text-gray-400 focus:border-teal focus:outline-none transition-colors"
            />
            <input
              type="text"
              placeholder="Last name"
              className="w-full rounded-lg border-2 border-teal/25 bg-white px-5 py-3.5 font-poppins text-base font-medium text-black placeholder:text-gray-400 focus:border-teal focus:outline-none transition-colors"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-lg border-2 border-teal/25 bg-white px-5 py-3.5 font-poppins text-base font-medium text-black placeholder:text-gray-400 focus:border-teal focus:outline-none transition-colors"
            />
            <textarea
              placeholder="Message"
              rows={6}
              className="w-full resize-none rounded-lg border-2 border-teal/25 bg-white px-5 py-3.5 font-poppins text-base font-medium text-black placeholder:text-gray-400 focus:border-teal focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="mt-2 w-fit rounded-2xl bg-teal px-10 py-3.5 font-poppins text-base font-bold text-white shadow transition-all hover:brightness-105 active:scale-95"
            >
              Send Message
            </button>
          </form>

          {/* Illustration */}
          <div className="flex items-center justify-center lg:col-span-6">
            <img
              src={contactIllustration}
              alt="Contact illustration"
              className="w-full max-w-[520px] object-contain drop-shadow-md"
            />
          </div>
        </div>
      </div>
    </section>
  )
}