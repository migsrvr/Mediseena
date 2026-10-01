import photoJosh from '../../assets/photo_josh.png'
import photoMiggy from '../../assets/photo_miggy.png'
import photoStephane from '../../assets/photo_stephane.png'
import photoSonny from '../../assets/photo_sonny.png'
import socialFb from '../../assets/social_fb.svg'
import socialIg from '../../assets/social_ig.svg'
import socialGmail from '../../assets/social_gmail.svg'
import pageSvg14 from '../../assets/page_svg_14.svg'
import pageSvg18 from '../../assets/page_svg_18.svg'
import pageSvg13 from '../../assets/page_svg_13.svg'

const creators = [
  {
    name: 'Mr. Joshua Cyron Santos',
    photo: photoJosh,
    bgClass: 'bg-[#d9eaea] border-[#8ec3c1]',
    nameColor: 'text-[#064e5c]',
    stagger: false,
    socials: {
      fb: 'https://www.facebook.com/share/1BnJmYQ5mq/?mibextid=wwXIfr',
      ig: 'https://www.instagram.com/shua_snts?igsh=MTk4cHkwdzl0dWtyYg==&igsi=MTk4cHkwdzl0dWtyYg==',
      mail: 'mailto:joshuacyron.santos@my.jru.edu',
    },
  },
  {
    name: 'Mr. Miggy Rivera',
    photo: photoMiggy,
    bgClass: 'bg-[#064e5c] border-[#064e5c]',
    nameColor: 'text-white',
    stagger: true,
    socials: {
      fb: 'https://www.facebook.com/share/1BYAkeefdK/?mibextid=wwXIfr',
      ig: 'https://www.instagram.com/raive.exp?igsh=b3NmbTBpbnplODMw&igsi=b3NmbTBpbnplODMw',
      mail: 'mailto:miggy.rivera@my.jru.edu',
    },
  },
  {
    name: 'Ms. Stephane Aira Cayetano',
    photo: photoStephane,
    bgClass: 'bg-[#f6f8fc] border-[#d9eaea]',
    nameColor: 'text-[#064e5c]',
    stagger: false,
    socials: {
      fb: 'https://www.facebook.com/share/1BrDf1pRkf/?mibextid=wwXIfr',
      ig: 'https://www.instagram.com/teypiteypi?igsh=cTlkOThpbWJtNW04&igsi=cTlkOThpbWJtNW04&utm_source=qr',
      mail: 'mailto:stephaneaira.cayetano@my.jru.edu',
    },
  },
  {
    name: 'Mr. Sonny Jr. Berdin',
    photo: photoSonny,
    bgClass: 'bg-[#60aba8] border-[#d9eaea]',
    nameColor: 'text-white',
    stagger: true,
    socials: {
      fb: 'https://www.facebook.com/share/1EepnAbPp9/?mibextid=wwXIfr',
      ig: 'https://www.instagram.com/snnys.wrld?igsh=MTZvMnBsc3lqYW1nNA==&igsi=MTZvMnBsc3lqYW1nNA==',
      mail: 'mailto:sonnyjr.berdin@my.jru.edu',
    },
  },
]

export default function Creators() {
  return (
    <section className="relative w-full overflow-hidden pt-12 pb-24 lg:pb-32">
      {/* Decorative Floating Outlines */}
      <img
        src={pageSvg14}
        alt=""
        className="pointer-events-none absolute left-6 top-1/3 w-14 lg:w-18"
      />
      <img
        src={pageSvg18}
        alt=""
        className="pointer-events-none absolute left-1/3 top-10 w-16 opacity-60"
      />
      <img
        src={pageSvg13}
        alt=""
        className="pointer-events-none absolute right-4 top-1/4 w-16 lg:w-20"
      />
      <img
        src={pageSvg14}
        alt=""
        className="pointer-events-none absolute right-1/4 bottom-8 w-14 lg:w-16"
      />

      {/* Heading - Aligned to the right */}
      <div className="mx-auto max-w-[1360px] px-6 mb-12 flex justify-end">
        <div className="text-right">
          <h2 className="font-poppins text-3xl sm:text-4xl lg:text-[44px] font-bold text-teal tracking-tight">
            MEET THE CREATORS
          </h2>
          <div className="ml-auto mt-2 h-2 w-56 sm:w-64 rounded-full bg-teal-deep" />
        </div>
      </div>

      {/* 4 Staggered Creator Cards */}
      <div className="mx-auto max-w-[1360px] px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 justify-items-center">
          {creators.map((creator) => (
            <div
              key={creator.name}
              className={`w-full max-w-[310px] min-h-[500px] rounded-[46px] border-[6px] p-6 shadow-[0_10px_25px_rgba(0,0,0,0.22)] flex flex-col items-center justify-between transition-transform duration-300 hover:-translate-y-2 ${
                creator.bgClass
              } ${creator.stagger ? 'lg:translate-y-14' : 'lg:translate-y-0'}`}
            >
              {/* Photo */}
              <div className="w-[218px] h-[218px] rounded-[18px] overflow-hidden shrink-0 shadow-sm">
                <img
                  src={creator.photo}
                  alt={creator.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Name */}
              <p
                className={`font-poppins text-[24px] lg:text-[26px] font-light italic leading-snug text-center my-auto px-1 ${creator.nameColor}`}
              >
                {creator.name}
              </p>

              {/* Socials */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <a
                  href={creator.socials.fb}
                  target="_blank"
                  rel="noreferrer"
                  className="h-6 w-6 transition-transform hover:scale-110"
                  aria-label="Facebook"
                >
                  <img src={socialFb} alt="Facebook" className="h-full w-full" />
                </a>
                <a
                  href={creator.socials.ig}
                  target="_blank"
                  rel="noreferrer"
                  className="h-6 w-6 transition-transform hover:scale-110"
                  aria-label="Instagram"
                >
                  <img src={socialIg} alt="Instagram" className="h-full w-full" />
                </a>
                <a
                  href={creator.socials.mail}
                  className="h-6 w-6 transition-transform hover:scale-110"
                  aria-label="Email"
                >
                  <img src={socialGmail} alt="Email" className="h-full w-full" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}