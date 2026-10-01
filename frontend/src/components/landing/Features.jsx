import cardIconBg from '../../assets/card_icon_bg.svg'
import iconSearching from '../../assets/icon_searching.png'
import iconOcr from '../../assets/icon_ocr.png'
import iconStructured from '../../assets/icon_structured.png'
import iconDownloading from '../../assets/icon_downloading.svg'
import iconDownload from '../../assets/icon_download.png'

const features = [
  {
    title: 'Prescription Scanning',
    body: 'Upload or capture handwritten prescriptions in PDF format',
    icon: iconSearching,
  },
  {
    title: 'OCR Text Extraction',
    body: 'OCR technology extracts text and identifies key details',
    icon: iconOcr,
  },
  {
    title: 'Structured Information',
    body: 'Converts unstructured text into organized, structured medical information',
    icon: iconStructured,
  },
  {
    title: 'Review and Save',
    body: 'Review the extracted information, then save the verified prescription',
    icon: iconDownloading,
  },
  {
    title: 'Download',
    body: 'Download prescription information as PDF documents',
    icon: iconDownload,
  },
]

export default function Features() {
  return (
    <section id="features" className="relative w-full py-16 lg:py-24">
      {/* Title */}
      <div className="mx-auto max-w-[1360px] px-6 text-center mb-12 lg:mb-16">
        <p className="font-poppins text-lg sm:text-xl font-normal text-teal mb-1">
          Features
        </p>
        <h2 className="font-poppins text-3xl sm:text-4xl lg:text-[44px] font-bold text-teal tracking-tight">
          Our Features &amp; Services
        </h2>
      </div>

      {/* 5 Feature Cards */}
      <div className="mx-auto max-w-[1360px] px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex min-h-[380px] flex-col items-center rounded-[20px] border-2 border-teal bg-white p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Icon Container with Circular Teal BG */}
              <div className="relative mb-5 flex h-24 w-24 items-center justify-center shrink-0">
                <img
                  src={cardIconBg}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain"
                />
                <img
                  src={feature.icon}
                  alt={feature.title}
                  className="relative z-10 max-h-14 max-w-14 object-contain"
                />
              </div>

              {/* Title */}
              <h3 className="font-poppins text-lg lg:text-[20px] font-semibold leading-snug text-teal-deep min-h-[50px] flex items-center justify-center mb-2">
                {feature.title}
              </h3>

              {/* Body */}
              <p className="font-poppins text-sm text-teal-deep/85 leading-relaxed">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}