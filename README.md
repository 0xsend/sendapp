```
     ██╗██╗   ██╗███████╗████████╗    ███████╗███████╗███╗   ██╗██████╗     ██╗████████╗
     ██║██║   ██║██╔════╝╚══██╔══╝    ██╔════╝██╔════╝████╗  ██║██╔══██╗    ██║╚══██╔══╝
     ██║██║   ██║███████╗   ██║       ███████╗█████╗  ██╔██╗ ██║██║  ██║    ██║   ██║
██   ██║██║   ██║╚════██║   ██║       ╚════██║██╔══╝  ██║╚██╗██║██║  ██║    ██║   ██║
╚█████╔╝╚██████╔╝███████║   ██║       ███████║███████╗██║ ╚████║██████╔╝    ██║   ██║
 ╚════╝  ╚═════╝ ╚══════╝   ╚═╝       ╚══════╝╚══════╝╚═╝  ╚═══╝╚═════╝     ╚═╝   ╚═╝
```

![GitHub forks](https://img.shields.io/github/forks/0xsend/sendapp?style=social)
![GitHub top language](https://img.shields.io/github/languages/top/0xsend/sendapp?color=yellow)

# Send App Monorepo

Send is a next-generation payments app that makes sending, receiving, and earning money as seamless as texting. Enabling instant, global transfers and providing banking features for the digital age, Send is built for everyday users at the front, with blockchain at the back. Send combines the speed of modern digital payments with the security and transparency of blockchain—without the complexity.

We created Send because traditional banking infrastructure is no longer fit for the pace and expectations of today’s world. Between outdated rails, hidden fees, and custodial control, users are left with slow transactions, hidden costs, and little say in how their money is handled. For the 1.4 billion unbanked individuals globally, these systems aren’t just slow—they’re inaccessible.

Send offers an alternative: a user-first, non-custodial app where you stay in control of your funds. Using USDC, you can send money globally in seconds, with no intermediaries or banking hours in the way. Whether you're paying rent, splitting dinner, or sending funds overseas, Send makes it fast, reliable, and simple.

More info here: https://info.send.it/send-docs

## What are we currently working on?
1. Send UX: improve our onboarding, UX, and our SEND token experiences.
2. iOS and Android Apps
3. Send Card - spend stables with a debit card
4. Virtual Accounts - US Banking Checking and Routing number
5. Private p2p transactions on Canton

## Using `buildSeo`

The `buildSeo` function simplifies the process of managing SEO across our application. It integrates with [NextSeo](https://github.com/garmeeh/next-seo) to provide a seamless way to handle SEO metadata.

### How to Use

1. **Import `buildSeo`:** Import the function from the relevant module in your component.
   
   ```javascript
   import { buildSeo } from 'your-seo-module';
   ```

2. **Define SEO Metadata:** Use `buildSeo` to define SEO metadata for your page.
   
   ```javascript
   const seoConfig = buildSeo({
       title: 'Your Page Title',
       description: 'Description of your page',
       openGraph: {
         url: 'http://example.com',
         title: 'Your OG Title',
         description: 'Description for open graph',
         images: [
           {
             url: 'http://example.com/og-image.jpg',
             width: 800,
             height: 600,
             alt: 'Og Image Alt',
           }
         ]
       }
   });
   ```

3. **Integrate with Next.js SEO:** Use the generated config with `NextSeo`.
   
   ```jsx
   import { NextSeo } from 'next-seo';

   export default function YourPage() {
       return (
           <>
               <NextSeo {...seoConfig} />
               {/* Page content */}
           </>
       );
   }
   ```

For more details on customization and advanced configurations, please refer to the [NextSeo documentation](https://github.com/garmeeh/next-seo).

## Contributing

See the [CONTRIBUTING.md](CONTRIBUTING.md) file for details.
