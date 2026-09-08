import type { KitCategory, KitMessage } from "@/content/kit-incassa";

export const categoriesEn: KitCategory[] = [
  { slug: "ritardo-lieve", name: "Slightly overdue (3 days)" },
  { slug: "ritardo-medio", name: "Moderately overdue (7 days)" },
  { slug: "visualizzato-no-risposta", name: "Seen but no reply" },
  { slug: "primo-sollecito", name: "First reminder" },
  { slug: "secondo-sollecito", name: "Second reminder" },
  { slug: "sollecito-finale", name: "Final notice" },
  { slug: "promesso-bonifico", name: "Promised a bank transfer" },
  { slug: "promesso-venerdi", name: "Promised to pay \"Friday\"" },
  { slug: "pagamento-parziale", name: "Partial payment received" },
  { slug: "cliente-abituale", name: "Regular client" },
  { slug: "cliente-nuovo", name: "New/one-off client" },
  { slug: "azienda", name: "Business (B2B)" },
  { slug: "privato", name: "Private client (B2C)" },
  { slug: "ringraziamento", name: "Thank-you after payment" },
  { slug: "silenzio-prolungato", name: "After a long silence" },
  { slug: "conferma-pagamento", name: "Payment confirmation request" },
  { slug: "sconto-rateizzazione", name: "Client asks for a discount or payment plan" },
];

export const messagesEn: KitMessage[] = [
  // 1. Slightly overdue (3 days) — 4 tones
  {
    id: "ritardo-lieve-gentile",
    categorySlug: "ritardo-lieve",
    tone: "Gentile",
    text: "Hi [Name], hope you're doing well! Just a quick reminder that invoice #[Number] for [Amount] was due on [Date]. It probably slipped your mind with everything going on — whenever you get a minute, I'd really appreciate you taking a look 😊",
  },
  {
    id: "ritardo-lieve-cordiale",
    categorySlug: "ritardo-lieve",
    tone: "Cordiale",
    text: "Hello [Name], a quick reminder: invoice #[Number] for [Amount], due on [Date], is still outstanding. Thank you in advance for your attention.",
  },
  {
    id: "ritardo-lieve-diretto",
    categorySlug: "ritardo-lieve",
    tone: "Diretto",
    text: "Hi [Name], invoice #[Number] for [Amount] was due on [Date] and is still open. Can you take care of it in the next few days?",
  },
  {
    id: "ritardo-lieve-formale",
    categorySlug: "ritardo-lieve",
    tone: "Formale",
    text: "Dear [Name], this is to inform you that invoice #[Number], for an amount of [Amount] and due on [Date], remains unpaid as of today. We kindly ask you to arrange payment at your earliest convenience.",
  },

  // 2. Moderately overdue (7 days) — 4 tones
  {
    id: "ritardo-medio-gentile",
    categorySlug: "ritardo-medio",
    tone: "Gentile",
    text: "Hi [Name], following up again on invoice #[Number] for [Amount], now overdue by a week (due [Date]). I know it's easy to lose track of due dates — let me know if you need anything from me to get this settled.",
  },
  {
    id: "ritardo-medio-cordiale",
    categorySlug: "ritardo-medio",
    tone: "Cordiale",
    text: "Hello [Name], invoice #[Number] for [Amount] has now been overdue for 7 days (due [Date]) and remains unpaid. I kindly ask you to settle it as soon as possible.",
  },
  {
    id: "ritardo-medio-diretto",
    categorySlug: "ritardo-medio",
    tone: "Diretto",
    text: "[Name], it's been 7 days since invoice #[Number] ([Amount]) was due and payment hasn't come through yet. Can you give me an update on when you'll settle it?",
  },
  {
    id: "ritardo-medio-formale",
    categorySlug: "ritardo-medio",
    tone: "Formale",
    text: "Dear [Name], we would like to inform you that invoice #[Number], due on [Date] for an amount of [Amount], has now been outstanding for 7 days. Please arrange payment within 3 business days.",
  },

  // 3. Seen but no reply — 4 tones
  {
    id: "visualizzato-gentile",
    categorySlug: "visualizzato-no-risposta",
    tone: "Gentile",
    text: "Hi [Name], I imagine you're busy! Just writing again to make sure my message about invoice #[Number] for [Amount] didn't get lost. No rush, just let me know 🙂",
  },
  {
    id: "visualizzato-cordiale",
    categorySlug: "visualizzato-no-risposta",
    tone: "Cordiale",
    text: "Hello [Name], I noticed you read my message about invoice #[Number] for [Amount]. I'll wait to hear back from you so we can sort out the payment.",
  },
  {
    id: "visualizzato-diretto",
    categorySlug: "visualizzato-no-risposta",
    tone: "Diretto",
    text: "[Name], I can see you read the message but haven't heard back. Can you confirm when you'll settle invoice #[Number] for [Amount]?",
  },
  {
    id: "visualizzato-formale",
    categorySlug: "visualizzato-no-risposta",
    tone: "Formale",
    text: "Dear [Name], our previous message regarding invoice #[Number] appears to have been read without a response. Please provide us with an update on the expected payment timeline.",
  },

  // 4. First reminder — 3 tones
  {
    id: "primo-sollecito-gentile",
    categorySlug: "primo-sollecito",
    tone: "Gentile",
    text: "Hi [Name], just a friendly first reminder: invoice #[Number] for [Amount] (due [Date]) is still open. If you've already taken care of it, please disregard this message!",
  },
  {
    id: "primo-sollecito-cordiale",
    categorySlug: "primo-sollecito",
    tone: "Cordiale",
    text: "Hello [Name], this is a first reminder regarding invoice #[Number] for [Amount], due on [Date]. Thank you for your attention, and I'm happy to help with any questions.",
  },
  {
    id: "primo-sollecito-formale",
    categorySlug: "primo-sollecito",
    tone: "Formale",
    text: "Dear [Name], this is a first payment reminder regarding invoice #[Number], due on [Date], for an amount of [Amount]. Please arrange payment within 7 days.",
  },

  // 5. Second reminder — 3 tones
  {
    id: "secondo-sollecito-cordiale",
    categorySlug: "secondo-sollecito",
    tone: "Cordiale",
    text: "Hello [Name], unfortunately I still haven't received payment for invoice #[Number] for [Amount], which I already followed up on previously. I kindly ask you to settle it this week.",
  },
  {
    id: "secondo-sollecito-diretto",
    categorySlug: "secondo-sollecito",
    tone: "Diretto",
    text: "[Name], this is the second reminder for invoice #[Number] for [Amount]. I still haven't received payment or a response. I need a firm date for when I'll receive the balance.",
  },
  {
    id: "secondo-sollecito-formale",
    categorySlug: "secondo-sollecito",
    tone: "Formale",
    text: "Dear [Name], following up on our previous reminder, we would like to inform you that invoice #[Number] for [Amount] remains unpaid. Please arrange payment within 5 days, after which we will consider the necessary steps to protect our receivable.",
  },

  // 6. Final notice — 2 tones
  {
    id: "sollecito-finale-diretto",
    categorySlug: "sollecito-finale",
    tone: "Diretto",
    text: "[Name], despite previous reminders, invoice #[Number] for [Amount] remains unpaid. I need you to settle it by [Date], or I'll have to consider other ways to recover this debt.",
  },
  {
    id: "sollecito-finale-formale",
    categorySlug: "sollecito-finale",
    tone: "Formale",
    text: "Dear [Name], having received no response to our previous reminders, we inform you that should invoice #[Number] for [Amount] not be settled by [Date], we will be forced to proceed with appropriate debt-recovery action, including any applicable late-payment interest.",
  },

  // 7. Promised a bank transfer — 2 tones
  {
    id: "promesso-bonifico-gentile",
    categorySlug: "promesso-bonifico",
    tone: "Gentile",
    text: "Hi [Name], you mentioned you'd sent the transfer for invoice #[Number] for [Amount], but it hasn't come through yet. Could you double-check that it actually went out?",
  },
  {
    id: "promesso-bonifico-diretto",
    categorySlug: "promesso-bonifico",
    tone: "Diretto",
    text: "[Name], the transfer for invoice #[Number] for [Amount] you told me about still hasn't arrived. Please send me the transfer receipt as soon as you can so I can check with the bank.",
  },

  // 8. Promised to pay "Friday" — 2 tones
  {
    id: "promesso-venerdi-gentile",
    categorySlug: "promesso-venerdi",
    tone: "Gentile",
    text: "Hi [Name], as agreed you'd mentioned Friday for settling invoice #[Number] for [Amount]. Just wanted a quick update — is that still on track?",
  },
  {
    id: "promesso-venerdi-diretto",
    categorySlug: "promesso-venerdi",
    tone: "Diretto",
    text: "[Name], we'd agreed on Friday for payment of invoice #[Number] for [Amount] and it still hasn't come through. What happened?",
  },

  // 9. Partial payment received — 2 tones
  {
    id: "pagamento-parziale-gentile",
    categorySlug: "pagamento-parziale",
    tone: "Gentile",
    text: "Hi [Name], thanks for the transfer of [Partial Amount]! Just a reminder that invoice #[Number] still has a remaining balance of [Remaining Amount]. Let me know when you'll be able to complete the payment.",
  },
  {
    id: "pagamento-parziale-formale",
    categorySlug: "pagamento-parziale",
    tone: "Formale",
    text: "Dear [Name], we confirm receipt of the partial payment of [Partial Amount] against invoice #[Number]. A remaining balance of [Remaining Amount] is still due, which we ask you to settle by [Date].",
  },

  // 10. Regular client — 2 tones
  {
    id: "cliente-abituale-gentile",
    categorySlug: "cliente-abituale",
    tone: "Gentile",
    text: "Hi [Name], it's always a pleasure working with you! Just writing to remind you about invoice #[Number] for [Amount], still open. Whenever works for you, let's get it sorted 😊",
  },
  {
    id: "cliente-abituale-cordiale",
    categorySlug: "cliente-abituale",
    tone: "Cordiale",
    text: "Hello [Name], given our long-standing collaboration, I'm writing informally: invoice #[Number] for [Amount] is still outstanding. Thank you as always for your responsiveness.",
  },

  // 11. New/one-off client — 1
  {
    id: "cliente-nuovo-formale",
    categorySlug: "cliente-nuovo",
    tone: "Formale",
    text: "Dear [Name], we are writing regarding invoice #[Number], issued for the work carried out on [Job Date], for an amount of [Amount], which is now overdue. Please arrange payment; we remain available for any questions.",
  },

  // 12. Business (B2B) — 2 tones
  {
    id: "azienda-cordiale",
    categorySlug: "azienda",
    tone: "Cordiale",
    text: "Hello, I'm writing on behalf of [Supplier Company Name] regarding invoice #[Number], addressed to [Client Company Name], for [Amount] and due on [Date]. Could you confirm the payment status with your accounts department?",
  },
  {
    id: "azienda-formale",
    categorySlug: "azienda",
    tone: "Formale",
    text: "Dear [Company Name], this is to inform you that invoice #[Number], issued on [Issue Date] and due on [Date], for an amount of [Amount], remains unpaid as of today. Please regularize the position and kindly confirm by email.",
  },

  // 13. Private client (B2C) — 1
  {
    id: "privato-gentile",
    categorySlug: "privato",
    tone: "Gentile",
    text: "Hi [Name], hope everything's going well since we finished the job! Just a reminder that [Amount] is still due for the work on [Job Date]. Pay whenever suits you, by transfer or cash.",
  },

  // 14. Thank-you after payment — 2 tones
  {
    id: "ringraziamento-gentile",
    categorySlug: "ringraziamento",
    tone: "Gentile",
    text: "Hi [Name], I just saw the payment for invoice #[Number] come through — thank you so much! Always a pleasure working with you 🙏",
  },
  {
    id: "ringraziamento-formale",
    categorySlug: "ringraziamento",
    tone: "Formale",
    text: "Dear [Name], we confirm receipt of payment for invoice #[Number] for [Amount]. Thank you for your business, and we remain available for any future needs.",
  },

  // 15. After a long silence — 1
  {
    id: "silenzio-prolungato-diretto",
    categorySlug: "silenzio-prolungato",
    tone: "Diretto",
    text: "[Name], last time you told me \"let me see what I can do\" about invoice #[Number] for [Amount], but [Number of Days] days have gone by with no news. I need to know how to proceed — can you get back to me by tomorrow?",
  },

  // 16. Payment confirmation request — 1
  {
    id: "conferma-pagamento-gentile",
    categorySlug: "conferma-pagamento",
    tone: "Gentile",
    text: "Hi [Name], could you confirm whether you've already sent the transfer for invoice #[Number] for [Amount]? I don't see it yet — maybe it's just still processing at the bank.",
  },

  // 17. Client asks for a discount or payment plan — 1
  {
    id: "sconto-rateizzazione-cordiale",
    categorySlug: "sconto-rateizzazione",
    tone: "Cordiale",
    text: "Hi [Name], I understand, and I'm happy to work something out. Could we split the [Amount] into [Number of Installments] installments of [Installment Amount], with the first due by [Date]? Let me know if that works and we'll put it in writing.",
  },
];
