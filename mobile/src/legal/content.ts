export const SUPPORT_EMAIL = 'dyppulse@gmail.com';
export const LEGAL_UPDATED = '16 October 2026';

export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = { title: string; intro: string; sections: LegalSection[] };

export const LEGAL_DOCS: Record<'privacy' | 'terms', LegalDoc> = {
  privacy: {
    title: 'Privacy Policy',
    intro:
      'Dyp Farms Coffee ("we", "us") runs a marketplace and farm tools for coffee farmers, buyers and visitors in Uganda. This policy explains what we collect, why, and the choices you have. We handle personal data in line with the Data Protection and Privacy Act, 2019 (Uganda).',
    sections: [
      {
        heading: 'What we collect',
        body: [
          'Account details: your name, email address and role (farmer, buyer or tourist). Your password is stored only as a salted hash.',
          'Transactions: wallet activity, orders, tour bookings, bids and the mobile money number you enter to pay.',
          'Farm details: farm names and the boundary you draw on the map, so lots can be traced to their origin.',
          'Photos: pictures of coffee beans you choose to submit for quality grading.',
          'Location: your device location, only while the app is open and only when you use farm boundary mapping.',
          'Support messages and notifications sent to you in the app.',
        ],
      },
      {
        heading: 'What stays on your device',
        body: [
          'Face ID and fingerprint sign-in is handled by your phone. We never receive or store your biometric data.',
          'Your sign-in session is kept in your phone\'s secure storage.',
        ],
      },
      {
        heading: 'How we use it',
        body: [
          'To run your account, process payments and bookings, show your orders and receipts, grade bean photos, and send service messages.',
          'To keep the service safe, such as limiting repeated failed logins and investigating fraud.',
          'We do not sell your personal data and we do not show third-party advertising.',
        ],
      },
      {
        heading: 'Who we share it with',
        body: [
          'Payment providers (MTN Mobile Money and Airtel Money) receive the amount, your mobile money number and a reference so they can process the payment.',
          'Hosting and database providers (Render and Neon) store data on our behalf under contract.',
          'Google Maps loads the map when you draw a farm boundary, so Google receives your device\'s IP address and the map area you view.',
          'Tour hosts and sellers see the details needed to complete a booking or order you make.',
          'We disclose data when the law requires it.',
        ],
      },
      {
        heading: 'How long we keep it',
        body: [
          'We keep account data while your account is open and delete it when you delete your account. Financial records are kept, without your personal details, for the period the law requires.',
        ],
      },
      {
        heading: 'Your choices and rights',
        body: [
          'You can delete your account yourself in the app: Profile, then Security, then Delete account. This removes your profile, farms, notifications and support tickets.',
          'Payment, booking and order records are kept after deletion with your personal details removed, because we must keep financial records. You can withdraw location and camera permission in your phone settings at any time.',
          `To see or correct your data, or if you cannot sign in to delete your account, email ${SUPPORT_EMAIL} from your registered address.`,
        ],
      },
      {
        heading: 'Security and children',
        body: [
          'Data is sent over encrypted connections and passwords are hashed. No system is perfectly secure, so please use a strong password.',
          'The app is for people aged 18 and over. We do not knowingly collect data from anyone younger and will delete it if we learn we have.',
        ],
      },
      {
        heading: 'Changes and contact',
        body: [
          'If we change this policy in a meaningful way we will tell you in the app.',
          `Questions: ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    intro:
      'By creating an account or using Dyp Farms Coffee you agree to these terms. If you do not agree, please do not use the app.',
    sections: [
      {
        heading: 'Your account',
        body: [
          'You must give accurate details and keep your password secure. You are responsible for activity on your account.',
          'You must be at least 18 to buy, sell, bid or pay through the app.',
        ],
      },
      {
        heading: 'Marketplace and auctions',
        body: [
          'Sellers are responsible for the accuracy of their lot descriptions, grades and quantities. A bid in an auction is a binding offer to buy at that price.',
          'Quality grades produced from photos are estimates to help you decide. They do not replace a laboratory cupping or physical inspection.',
        ],
      },
      {
        heading: 'Payments and wallet',
        body: [
          'Payments are made in Uganda shillings (UGX) through MTN Mobile Money or Airtel Money. Provider fees and limits may apply.',
          'Wallet balances are not bank deposits and earn no interest. Withdrawals go to a mobile money number you control.',
        ],
      },
      {
        heading: 'Tours and bookings',
        body: [
          'A booking is confirmed once payment succeeds and you receive your ticket. Cancellation and refund rules are shown on the tour before you pay.',
        ],
      },
      {
        heading: 'Financing and subscriptions',
        body: [
          'Financing offers are estimates and subject to approval. Subscriptions renew on their chosen frequency until you pause or cancel them in the app.',
        ],
      },
      {
        heading: 'Acceptable use',
        body: [
          'Do not post false listings, abuse other users, attempt to bypass security, or use the app for unlawful activity. We may suspend accounts that do.',
        ],
      },
      {
        heading: 'Liability',
        body: [
          'We work to keep the app available and accurate but provide it as is. To the extent the law allows, we are not liable for indirect losses, or for losses caused by events outside our control such as network or mobile money outages.',
        ],
      },
      {
        heading: 'Governing law and contact',
        body: [
          'These terms are governed by the laws of Uganda.',
          `Questions: ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },
};
