export type Tone = "Gentile" | "Cordiale" | "Diretto" | "Formale";

export interface KitCategory {
  slug: string;
  name: string;
}

export interface KitMessage {
  id: string;
  categorySlug: string;
  tone?: Tone;
  text: string;
}

export const categories: KitCategory[] = [
  { slug: "ritardo-lieve", name: "Ritardo lieve (3 giorni)" },
  { slug: "ritardo-medio", name: "Ritardo medio (7 giorni)" },
  { slug: "visualizzato-no-risposta", name: "Visualizzato e non ha risposto" },
  { slug: "primo-sollecito", name: "Primo sollecito" },
  { slug: "secondo-sollecito", name: "Secondo sollecito" },
  { slug: "sollecito-finale", name: "Sollecito finale" },
  { slug: "promesso-bonifico", name: "Ha promesso un bonifico" },
  { slug: "promesso-venerdi", name: "Ha promesso di pagare \"venerdì\"" },
  { slug: "pagamento-parziale", name: "Pagamento parziale ricevuto" },
  { slug: "cliente-abituale", name: "Cliente abituale" },
  { slug: "cliente-nuovo", name: "Cliente nuovo/occasionale" },
  { slug: "azienda", name: "Azienda (B2B)" },
  { slug: "privato", name: "Cliente privato (B2C)" },
  { slug: "ringraziamento", name: "Ringraziamento dopo il pagamento" },
  { slug: "silenzio-prolungato", name: "Dopo un lungo silenzio" },
  { slug: "conferma-pagamento", name: "Richiesta di conferma pagamento" },
  { slug: "sconto-rateizzazione", name: "Cliente chiede sconto o rateizzazione" },
];

export const messages: KitMessage[] = [
  // 1. Ritardo lieve (3 giorni) — 4 toni
  {
    id: "ritardo-lieve-gentile",
    categorySlug: "ritardo-lieve",
    tone: "Gentile",
    text: "Ciao [Nome], spero tutto bene! Volevo solo ricordarti che la fattura n. [Numero] di [Importo] risultava in scadenza il [Data]. Probabilmente ti è sfuggita tra mille impegni: se puoi darci un'occhiata quando hai un minuto te ne sarei grato/a 😊",
  },
  {
    id: "ritardo-lieve-cordiale",
    categorySlug: "ritardo-lieve",
    tone: "Cordiale",
    text: "Buongiorno [Nome], le scrivo per un breve promemoria: la fattura n. [Numero] di [Importo], scaduta il [Data], risulta ancora da saldare. La ringrazio fin d'ora per la sua attenzione.",
  },
  {
    id: "ritardo-lieve-diretto",
    categorySlug: "ritardo-lieve",
    tone: "Diretto",
    text: "Ciao [Nome], la fattura n. [Numero] di [Importo] è scaduta il [Data] e risulta ancora aperta. Puoi procedere con il pagamento nei prossimi giorni?",
  },
  {
    id: "ritardo-lieve-formale",
    categorySlug: "ritardo-lieve",
    tone: "Formale",
    text: "Gentile [Nome], con la presente le segnaliamo che la fattura n. [Numero], dell'importo di [Importo] e con scadenza [Data], risulta a oggi non saldata. La invitiamo a provvedere al pagamento a stretto giro.",
  },

  // 2. Ritardo medio (7 giorni) — 4 toni
  {
    id: "ritardo-medio-gentile",
    categorySlug: "ritardo-medio",
    tone: "Gentile",
    text: "Ciao [Nome], torno a scriverti per la fattura n. [Numero] di [Importo], scaduta ormai da una settimana ([Data]). So che capita di perdere il conto delle scadenze: fammi sapere se hai bisogno di qualcosa da parte mia per chiudere il pagamento.",
  },
  {
    id: "ritardo-medio-cordiale",
    categorySlug: "ritardo-medio",
    tone: "Cordiale",
    text: "Buongiorno [Nome], la fattura n. [Numero] di [Importo] risulta scaduta da 7 giorni (scadenza [Data]) e non ancora saldata. Le chiedo gentilmente di regolarizzare la posizione appena possibile.",
  },
  {
    id: "ritardo-medio-diretto",
    categorySlug: "ritardo-medio",
    tone: "Diretto",
    text: "[Nome], sono passati 7 giorni dalla scadenza della fattura n. [Numero] ([Importo]) e il pagamento non risulta ancora arrivato. Puoi aggiornarmi su quando pensi di saldarla?",
  },
  {
    id: "ritardo-medio-formale",
    categorySlug: "ritardo-medio",
    tone: "Formale",
    text: "Gentile [Nome], la informiamo che la fattura n. [Numero], scaduta il [Data] per un importo di [Importo], risulta insoluta da 7 giorni. La preghiamo di provvedere al saldo entro 3 giorni lavorativi.",
  },

  // 3. Visualizzato e non ha risposto — 4 toni
  {
    id: "visualizzato-gentile",
    categorySlug: "visualizzato-no-risposta",
    tone: "Gentile",
    text: "Ciao [Nome], immagino tu sia impegnato/a! Ti scrivo di nuovo solo per essere sicuro/a che il messaggio sulla fattura n. [Numero] di [Importo] non sia passato inosservato. Nessuna fretta, ma fammi sapere 🙂",
  },
  {
    id: "visualizzato-cordiale",
    categorySlug: "visualizzato-no-risposta",
    tone: "Cordiale",
    text: "Buongiorno [Nome], ho visto che ha letto il messaggio riguardo alla fattura n. [Numero] di [Importo]. Resto in attesa di un suo riscontro per organizzarci sul pagamento.",
  },
  {
    id: "visualizzato-diretto",
    categorySlug: "visualizzato-no-risposta",
    tone: "Diretto",
    text: "[Nome], vedo che hai letto il messaggio ma non ho ricevuto risposta. Puoi confermarmi quando salderai la fattura n. [Numero] di [Importo]?",
  },
  {
    id: "visualizzato-formale",
    categorySlug: "visualizzato-no-risposta",
    tone: "Formale",
    text: "Gentile [Nome], risulta che il precedente messaggio relativo alla fattura n. [Numero] sia stato visualizzato senza riscontro. La preghiamo di volerci fornire un aggiornamento in merito ai tempi di pagamento.",
  },

  // 4. Primo sollecito — 3 toni
  {
    id: "primo-sollecito-gentile",
    categorySlug: "primo-sollecito",
    tone: "Gentile",
    text: "Ciao [Nome], questo è un primo promemoria amichevole: la fattura n. [Numero] di [Importo] (scadenza [Data]) è ancora aperta. Se hai già provveduto, ignora pure questo messaggio!",
  },
  {
    id: "primo-sollecito-cordiale",
    categorySlug: "primo-sollecito",
    tone: "Cordiale",
    text: "Buongiorno [Nome], le invio un primo sollecito per la fattura n. [Numero] di [Importo], scaduta il [Data]. La ringrazio per l'attenzione e resto a disposizione per qualsiasi chiarimento.",
  },
  {
    id: "primo-sollecito-formale",
    categorySlug: "primo-sollecito",
    tone: "Formale",
    text: "Gentile [Nome], con la presente le inviamo il primo sollecito di pagamento relativo alla fattura n. [Numero], scaduta il [Data], per un importo di [Importo]. La invitiamo a provvedere al saldo entro 7 giorni.",
  },

  // 5. Secondo sollecito — 3 toni
  {
    id: "secondo-sollecito-cordiale",
    categorySlug: "secondo-sollecito",
    tone: "Cordiale",
    text: "Buongiorno [Nome], purtroppo non ho ancora ricevuto il pagamento della fattura n. [Numero] di [Importo], già sollecitata in precedenza. Le chiedo di regolarizzare la posizione entro questa settimana.",
  },
  {
    id: "secondo-sollecito-diretto",
    categorySlug: "secondo-sollecito",
    tone: "Diretto",
    text: "[Nome], questo è il secondo sollecito per la fattura n. [Numero] di [Importo]. Ad oggi non ho ricevuto né il pagamento né una risposta. Ho bisogno di una data certa entro cui riceverò il saldo.",
  },
  {
    id: "secondo-sollecito-formale",
    categorySlug: "secondo-sollecito",
    tone: "Formale",
    text: "Gentile [Nome], facendo seguito al sollecito precedente, la informiamo che la fattura n. [Numero] di [Importo] risulta ancora insoluta. La invitiamo a provvedere al pagamento entro 5 giorni, trascorsi i quali valuteremo le azioni necessarie a tutela del nostro credito.",
  },

  // 6. Sollecito finale — 2 toni
  {
    id: "sollecito-finale-diretto",
    categorySlug: "sollecito-finale",
    tone: "Diretto",
    text: "[Nome], nonostante i solleciti precedenti, la fattura n. [Numero] di [Importo] risulta ancora non pagata. Ti chiedo di saldarla entro [Data], altrimenti sarò costretto/a a valutare altre vie per recuperare il credito.",
  },
  {
    id: "sollecito-finale-formale",
    categorySlug: "sollecito-finale",
    tone: "Formale",
    text: "Gentile [Nome], in assenza di riscontro ai solleciti precedenti, la informiamo che, qualora la fattura n. [Numero] di [Importo] non venga saldata entro [Data], saremo costretti a procedere con le opportune azioni di recupero credito, inclusi eventuali interessi di mora.",
  },

  // 7. Ha promesso un bonifico — 2 toni
  {
    id: "promesso-bonifico-gentile",
    categorySlug: "promesso-bonifico",
    tone: "Gentile",
    text: "Ciao [Nome], mi avevi detto che avresti effettuato il bonifico per la fattura n. [Numero] di [Importo], ma non risulta ancora accreditato. Puoi controllare se è partito correttamente?",
  },
  {
    id: "promesso-bonifico-diretto",
    categorySlug: "promesso-bonifico",
    tone: "Diretto",
    text: "[Nome], il bonifico per la fattura n. [Numero] di [Importo] che mi avevi annunciato non è ancora arrivato. Mandami la ricevuta del bonifico appena possibile, così verifico con la banca.",
  },

  // 8. Ha promesso di pagare "venerdì" — 2 toni
  {
    id: "promesso-venerdi-gentile",
    categorySlug: "promesso-venerdi",
    tone: "Gentile",
    text: "Ciao [Nome], come da accordi mi avevi detto venerdì per il saldo della fattura n. [Numero] di [Importo]. Volevo solo un piccolo aggiornamento: è ancora tutto confermato?",
  },
  {
    id: "promesso-venerdi-diretto",
    categorySlug: "promesso-venerdi",
    tone: "Diretto",
    text: "[Nome], avevamo detto venerdì per il pagamento della fattura n. [Numero] di [Importo] e ad oggi non risulta ancora arrivato. Cosa è successo?",
  },

  // 9. Pagamento parziale ricevuto — 2 toni
  {
    id: "pagamento-parziale-gentile",
    categorySlug: "pagamento-parziale",
    tone: "Gentile",
    text: "Ciao [Nome], grazie per il bonifico di [Importo Parziale]! Ti ricordo che sulla fattura n. [Numero] resta ancora un saldo di [Importo Residuo]. Fammi sapere quando pensi di completare il pagamento.",
  },
  {
    id: "pagamento-parziale-formale",
    categorySlug: "pagamento-parziale",
    tone: "Formale",
    text: "Gentile [Nome], confermiamo la ricezione del pagamento parziale di [Importo Parziale] a fronte della fattura n. [Numero]. Residua un importo di [Importo Residuo], che la invitiamo a saldare entro [Data].",
  },

  // 10. Cliente abituale — 2 toni
  {
    id: "cliente-abituale-gentile",
    categorySlug: "cliente-abituale",
    tone: "Gentile",
    text: "Ciao [Nome], sai che con te è sempre un piacere lavorare! Ti scrivo solo per ricordarti la fattura n. [Numero] di [Importo], ancora aperta. Appena puoi, sistemiamola insieme 😊",
  },
  {
    id: "cliente-abituale-cordiale",
    categorySlug: "cliente-abituale",
    tone: "Cordiale",
    text: "Buongiorno [Nome], vista la nostra collaborazione ormai consolidata, le scrivo in confidenza: la fattura n. [Numero] di [Importo] risulta ancora da saldare. La ringrazio come sempre per la sua disponibilità.",
  },

  // 11. Cliente nuovo/occasionale — 1
  {
    id: "cliente-nuovo-formale",
    categorySlug: "cliente-nuovo",
    tone: "Formale",
    text: "Gentile [Nome], la contattiamo in merito alla fattura n. [Numero], emessa per il lavoro svolto in data [Data Lavoro], dell'importo di [Importo] e attualmente scaduta. La invitiamo a provvedere al pagamento e restiamo a disposizione per qualsiasi informazione.",
  },

  // 12. Azienda (B2B) — 2 toni
  {
    id: "azienda-cordiale",
    categorySlug: "azienda",
    tone: "Cordiale",
    text: "Buongiorno, scrivo per conto di [Nome Azienda Fornitore] in merito alla fattura n. [Numero], intestata a [Nome Azienda Cliente], di [Importo] e scaduta il [Data]. Potreste confermarci lo stato del pagamento presso il vostro ufficio amministrativo?",
  },
  {
    id: "azienda-formale",
    categorySlug: "azienda",
    tone: "Formale",
    text: "Spett.le [Nome Azienda], con la presente si comunica che la fattura n. [Numero], emessa in data [Data Emissione] e scaduta il [Data], per un importo di [Importo], risulta a oggi non saldata. Si prega di voler regolarizzare la posizione e di darne cortese conferma via e-mail.",
  },

  // 13. Cliente privato (B2C) — 1
  {
    id: "privato-gentile",
    categorySlug: "privato",
    tone: "Gentile",
    text: "Ciao [Nome], spero vada tutto bene a casa dopo il nostro intervento! Ti ricordo che resta da saldare [Importo] per il lavoro del [Data Lavoro]. Puoi pagare quando preferisci, anche con bonifico o contanti.",
  },

  // 14. Ringraziamento dopo il pagamento — 2 toni
  {
    id: "ringraziamento-gentile",
    categorySlug: "ringraziamento",
    tone: "Gentile",
    text: "Ciao [Nome], ho appena visto il pagamento della fattura n. [Numero], grazie mille! È sempre un piacere lavorare con te 🙏",
  },
  {
    id: "ringraziamento-formale",
    categorySlug: "ringraziamento",
    tone: "Formale",
    text: "Gentile [Nome], confermiamo la ricezione del pagamento della fattura n. [Numero] di [Importo]. La ringraziamo per la collaborazione e restiamo a disposizione per eventuali future necessità.",
  },

  // 15. Dopo un lungo silenzio — 1
  {
    id: "silenzio-prolungato-diretto",
    categorySlug: "silenzio-prolungato",
    tone: "Diretto",
    text: "[Nome], l'ultima volta mi avevi detto \"vedo cosa posso fare\" riguardo alla fattura n. [Numero] di [Importo], ma sono passati [Numero Giorni] giorni senza notizie. Ho bisogno di sapere come procedere: puoi darmi una risposta entro domani?",
  },

  // 16. Richiesta di conferma pagamento — 1
  {
    id: "conferma-pagamento-gentile",
    categorySlug: "conferma-pagamento",
    tone: "Gentile",
    text: "Ciao [Nome], mi confermi se hai già effettuato il bonifico per la fattura n. [Numero] di [Importo]? Non lo vedo ancora accreditato, magari è solo in lavorazione dalla banca.",
  },

  // 17. Cliente chiede sconto o rateizzazione — 1
  {
    id: "sconto-rateizzazione-cordiale",
    categorySlug: "sconto-rateizzazione",
    tone: "Cordiale",
    text: "Ciao [Nome], capisco la richiesta e sono disponibile a trovare una soluzione. Possiamo dividere i [Importo] in [Numero Rate] rate da [Importo Rata], con la prima entro [Data]? Fammi sapere se ti va bene così formalizziamo per iscritto.",
  },
];
