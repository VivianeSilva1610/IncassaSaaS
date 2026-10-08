import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termini e Condizioni — Ristorante — INCASSA",
};

const SUPPORT_EMAIL = "viverevivi37@gmail.com";
const PEC_EMAIL = "supporto@pec.incassa.eu";
const LAST_UPDATED = "7 ottobre 2026";

export default function TerminiRestaurantePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-stone-700">
      <Link href="/" className="text-sm text-amber-700 underline underline-offset-2">
        ← Torna alla home
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">
        Termini e Condizioni di Servizio — Piattaforma per Ristoranti
      </h1>
      <p className="mt-1 text-sm text-stone-400">Ultimo aggiornamento: {LAST_UPDATED}</p>
      <p className="mt-2 text-sm text-stone-500">
        I presenti Termini e Condizioni (&quot;Termini&quot;) disciplinano l&apos;accesso e
        l&apos;utilizzo della piattaforma di gestione per ristoranti fornita da INCASSA
        (&quot;Piattaforma&quot; o &quot;Servizio&quot;), accessibile tramite incassa.eu e i
        sottodomini o domini personalizzati dei singoli ristoranti. Questi Termini sono distinti
        e separati dai{" "}
        <Link href="/termini" className="text-amber-700 underline underline-offset-2">
          Termini del Kit Incassa / abbonamento di gestione crediti
        </Link>
        , che restano in vigore invariati per i relativi utenti.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. Titolare del Servizio</h2>
          <p className="mt-2">
            Il Servizio è fornito da Viviane Silva, persona fisica, con sede a Catanzaro, Italia
            (di seguito &quot;INCASSA&quot;, &quot;Fornitore&quot; o &quot;Titolare&quot;).
          </p>
          <p className="mt-2">
            E-mail:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            — PEC:{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">2. Definizioni</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>&quot;Piattaforma&quot;</strong> indica il software multi-tenant di gestione
              per ristoranti fornito da INCASSA.
            </li>
            <li>
              <strong>&quot;Ristorante&quot;</strong> indica l&apos;attività di ristorazione che
              sottoscrive l&apos;Abbonamento e crea il proprio spazio (&quot;tenant&quot;) sulla
              Piattaforma.
            </li>
            <li>
              <strong>&quot;Titolare del Ristorante&quot;</strong> indica la persona fisica o
              giuridica che crea l&apos;Account iniziale del Ristorante e ne risulta proprietaria
              (&quot;owner&quot;).
            </li>
            <li>
              <strong>&quot;Membro del Team&quot;</strong> indica le persone invitate dal Titolare
              del Ristorante o da un Gestore ad accedere alla Piattaforma con permessi specifici.
            </li>
            <li>
              <strong>&quot;Gestore&quot;</strong> indica un Membro del Team a cui sono stati
              concessi permessi di gestione (ad esempio modifica o cancellazione di anagrafiche e
              assegnazione del ruolo ad altri Membri).
            </li>
            <li>
              <strong>&quot;Cliente Finale&quot;</strong> indica la persona che effettua un ordine
              presso il negozio online del Ristorante, senza creare un Account sulla Piattaforma.
            </li>
            <li>
              <strong>&quot;Negozio Online&quot;</strong> indica la pagina pubblica del Ristorante
              (sottodominio incassa.eu o dominio personalizzato) in cui i Clienti Finali possono
              consultare il menu ed effettuare ordini.
            </li>
            <li>
              <strong>&quot;Abbonamento&quot;</strong> indica il piano a pagamento che consente
              l&apos;accesso alle funzionalità della Piattaforma riservate al Ristorante.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">3. Oggetto del Servizio</h2>
          <p className="mt-2">
            La Piattaforma è uno strumento digitale di gestione operativa per ristoranti. A
            seconda del piano e delle funzionalità attivate, può comprendere, a titolo
            esemplificativo: gestione del menu e del catalogo prodotti; gestione di ordini e
            comande; organizzazione della cucina; controllo di magazzino/scorte; gestione di
            tavoli; controllo dei costi; registro di cassa; gestione del team con permessi
            differenziati; un negozio online pubblico con possibilità di ordine e pagamento da
            parte dei Clienti Finali; un modulo relativo agli adempimenti fiscali (si veda l&apos;art.
            11); e, dove attivata dal Titolare del Ristorante, l&apos;associazione di un dominio
            personalizzato.
          </p>
          <p className="mt-2">
            INCASSA costituisce uno strumento organizzativo e gestionale. INCASSA non è una banca,
            un istituto di pagamento, un intermediario finanziario, uno studio legale o un
            commercialista e non fornisce consulenza legale, fiscale, contabile o finanziaria.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">4. Registrazione, Account e ruoli</h2>
          <p className="mt-2">
            Per attivare un Ristorante sulla Piattaforma, il Titolare del Ristorante deve creare un
            Account fornendo informazioni corrette, complete e aggiornate, compreso il nome del
            Ristorante e l&apos;indirizzo (&quot;slug&quot;) scelto per il proprio spazio.
          </p>
          <p className="mt-2">
            Il Titolare del Ristorante può invitare Membri del Team e concedere a uno o più di essi
            il ruolo di Gestore. Il Titolare del Ristorante è responsabile delle attività svolte dai
            Membri del Team invitati, nei limiti dei permessi effettivamente concessi.
          </p>
          <p className="mt-2">
            Le credenziali di accesso sono personali e non devono essere cedute a terzi.
            L&apos;utilizzatore deve informare tempestivamente INCASSA in caso di accesso non
            autorizzato o sospetta compromissione dell&apos;Account.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">
            5. Dominio e identità del Ristorante
          </h2>
          <p className="mt-2">
            Ogni Ristorante dispone di un indirizzo pubblico nella forma incassa.eu/loja/[slug].
            Ove disponibile e attivata dal Titolare del Ristorante, la Piattaforma consente
            l&apos;associazione di un dominio personalizzato di proprietà del Ristorante, previa
            verifica tecnica del controllo del dominio stesso. La gestione, il rinnovo e i costi del
            dominio personalizzato restano a carico e sotto la responsabilità del Titolare del
            Ristorante.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">6. Abbonamento e prezzi</h2>
          <p className="mt-2">
            L&apos;accesso alle funzionalità della Piattaforma riservate al Ristorante è
            subordinato alla sottoscrizione di un Abbonamento. Prezzo, periodicità, funzionalità
            incluse e condizioni economiche applicabili sono indicate chiaramente prima della
            conclusione dell&apos;acquisto.
          </p>
          <p className="mt-2">
            Ove previsto, l&apos;Abbonamento può includere un periodo di prova gratuito di durata
            indicata al momento dell&apos;attivazione (attualmente 7 giorni), decorso il quale,
            salvo cancellazione, verrà addebitato automaticamente il prezzo dell&apos;Abbonamento
            sul metodo di pagamento fornito.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">7. Pagamenti dell&apos;Abbonamento</h2>
          <p className="mt-2">
            I pagamenti dell&apos;Abbonamento sono gestiti dal fornitore esterno Stripe. INCASSA non
            conserva direttamente i dati completi delle carte di pagamento. In caso di pagamento
            rifiutato, scaduto o non completato, INCASSA potrà richiedere l&apos;aggiornamento del
            metodo di pagamento e, dopo adeguata comunicazione ove richiesta, limitare o sospendere
            l&apos;accesso alle funzionalità a pagamento.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">
            8. Pagamenti degli ordini dei Clienti Finali
          </h2>
          <p className="mt-2">
            Ove il Ristorante attivi il Negozio Online, gli ordini dei Clienti Finali possono
            essere pagati tramite uno o più fornitori esterni di servizi di pagamento abilitati
            dalla Piattaforma (ad esempio Pix tramite Asaas in Brasile, o altri metodi disponibili
            secondo il paese e le impostazioni scelte dal Ristorante). INCASSA non è parte del
            contratto di vendita tra il Ristorante e il Cliente Finale, non interviene nella
            custodia dei fondi relativi a tali pagamenti e non garantisce l&apos;esito, la ricezione
            o l&apos;accredito del pagamento. Il Ristorante è l&apos;unico responsabile verso i
            propri Clienti Finali per l&apos;evasione degli ordini, la qualità dei prodotti e
            l&apos;eventuale gestione di rimborsi o reclami relativi agli ordini.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">
            9. Durata, rinnovo e cancellazione dell&apos;Abbonamento
          </h2>
          <p className="mt-2">
            Qualora l&apos;Abbonamento preveda rinnovo automatico, sarà rinnovato secondo la
            periodicità indicata nel checkout, salvo cancellazione effettuata prima del rinnovo
            tramite le funzionalità disponibili nell&apos;Account o gli ulteriori canali indicati da
            INCASSA.
          </p>
          <p className="mt-2">
            Salvo diversa indicazione o diritto inderogabile previsto dalla legge, la cancellazione
            impedisce i rinnovi successivi ma non determina automaticamente il rimborso del periodo
            già pagato. La cancellazione dell&apos;Abbonamento non coincide con l&apos;esercizio del
            diritto legale di recesso, ove applicabile (si veda l&apos;art. 10).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">
            10. Diritto di recesso del Consumatore
          </h2>
          <p className="mt-2">
            <strong>10.1 Termine di 14 giorni.</strong> Qualora il Titolare del Ristorante rivesta
            la qualifica di Consumatore, per i contratti conclusi a distanza dispone, salvo le
            eccezioni previste dalla legge, di 14 giorni per recedere dal contratto senza dover
            fornire alcuna motivazione, ai sensi degli artt. 52 e seguenti del Codice del Consumo.
          </p>
          <p className="mt-2">
            <strong>10.2 Inizio del Servizio durante il periodo di recesso.</strong> Qualora il
            Consumatore desideri utilizzare la Piattaforma immediatamente, anche durante un periodo
            di prova gratuito, prima della scadenza del periodo di recesso, potrà richiedere
            espressamente che l&apos;esecuzione del Servizio abbia inizio durante tale periodo. Nei
            casi previsti dalla legge, qualora il Consumatore eserciti il recesso dopo aver
            espressamente richiesto l&apos;inizio della prestazione, potrà essere tenuto al pagamento
            di un importo proporzionale rispetto a quanto fornito fino al momento del recesso.
          </p>
          <p className="mt-2">
            <strong>10.3 Come esercitare il recesso.</strong> Il Consumatore può comunicare la
            propria decisione di recedere mediante dichiarazione esplicita inviata a{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            , indicando almeno i dati necessari a identificare l&apos;Account e il Ristorante.
            INCASSA invierà senza indebito ritardo una conferma su supporto durevole (email)
            contenente le informazioni previste dalla legge.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">
            11. Modulo fiscale — stato attuale e limiti
          </h2>
          <p className="mt-2">
            La Piattaforma può includere un modulo relativo a documenti fiscali (ad esempio,
            classificazione fiscale di prodotti, bozze di documenti o, in futuro, emissione di
            documenti come la NFC-e brasiliana). <strong>Fino a diversa comunicazione esplicita di
            INCASSA</strong>, tali funzionalità possono operare in modalità simulata o di test e
            non costituiscono emissione di documenti fiscali validi, non sostituiscono gli obblighi
            fiscali del Ristorante presso le autorità competenti e non sostituiscono il lavoro di un
            commercialista o consulente fiscale abilitato.
          </p>
          <p className="mt-2">
            Il Ristorante resta l&apos;unico responsabile del rispetto dei propri obblighi fiscali,
            contabili e di emissione documentale secondo la normativa del proprio paese, anche
            quando utilizza strumenti o automazioni messi a disposizione dalla Piattaforma.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">
            12. Dati inseriti dal Ristorante e dai Clienti Finali
          </h2>
          <p className="mt-2">
            INCASSA non verifica automaticamente l&apos;esattezza, la completezza o la liceità dei
            dati inseriti dal Ristorante o raccolti dai Clienti Finali tramite il Negozio Online,
            salvo ove espressamente indicato per una specifica funzionalità. Il Ristorante è
            responsabile di verificare che tali dati siano corretti, aggiornati e raccolti nel
            rispetto della normativa applicabile.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">13. Utilizzo consentito</h2>
          <p className="mt-2">Il Titolare del Ristorante e i Membri del Team si impegnano a non utilizzare la Piattaforma:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>per attività illecite o fraudolente;</li>
            <li>per molestare, minacciare o ingannare terzi, compresi i Clienti Finali;</li>
            <li>per inserire intenzionalmente informazioni false, anche relative a prodotti, prezzi o pagamenti;</li>
            <li>per compromettere sicurezza, disponibilità o integrità della Piattaforma;</li>
            <li>per tentare accessi non autorizzati ad altri spazi tenant;</li>
            <li>
              per copiare, decompilare o sfruttare abusivamente software e infrastruttura, nei
              limiti consentiti dalla legge;
            </li>
            <li>violando diritti di terzi.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">14. Disponibilità del Servizio</h2>
          <p className="mt-2">
            INCASSA adotta misure ragionevoli per garantire continuità e sicurezza del Servizio.
            Tuttavia, possono verificarsi interruzioni dovute a manutenzione, aggiornamenti,
            problemi tecnici, servizi di terzi (inclusi Stripe, i fornitori di pagamento abilitati
            dal Ristorante, provider DNS/hosting), eventi di forza maggiore o esigenze di
            sicurezza.
          </p>
          <p className="mt-2">
            Nessuna disposizione dei presenti Termini esclude o limita diritti inderogabili
            riconosciuti al Consumatore.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">15. Modifiche del Servizio</h2>
          <p className="mt-2">
            INCASSA può aggiornare o modificare funzionalità della Piattaforma per motivi tecnici,
            di sicurezza, normativi, operativi o di miglioramento del prodotto. Quando una modifica
            incida significativamente su un servizio già acquistato, saranno rispettati gli obblighi
            di informazione e gli eventuali diritti dell&apos;Utente previsti dalla normativa
            applicabile.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">16. Proprietà intellettuale</h2>
          <p className="mt-2">
            Software, design, marchi, loghi, testi, elementi grafici, database, documentazione e
            altri contenuti appartenenti a INCASSA sono protetti dalle norme applicabili in materia
            di proprietà intellettuale. La sottoscrizione dell&apos;Abbonamento concede
            esclusivamente un diritto personale, limitato, non esclusivo e non trasferibile di
            utilizzare il Servizio secondo i presenti Termini.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">17. Dati del Ristorante e ruoli nel trattamento</h2>
          <p className="mt-2">
            Il Ristorante mantiene i diritti sui dati e contenuti propri inseriti nella Piattaforma
            (menu, prezzi, dati di cucina/magazzino) e resta titolare del trattamento dei dati
            personali dei propri Clienti Finali che raccoglie tramite il Negozio Online (nome,
            telefono, indirizzo di consegna, documento fiscale ove richiesto dal pagamento). INCASSA
            agisce come responsabile del trattamento di tali dati per conto del Ristorante, nella
            misura necessaria a fornire il Servizio.
          </p>
          <p className="mt-2">
            Il trattamento dei dati personali del Titolare del Ristorante e dei Membri del Team è
            disciplinato dalla{" "}
            <Link href="/privacy-restaurante" className="text-amber-700 underline underline-offset-2">
              Informativa sulla Privacy — Piattaforma per Ristoranti
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">18. Esportazione e cancellazione dei dati</h2>
          <p className="mt-2">
            Ove tecnicamente disponibile, il Ristorante potrà esportare i propri dati utilizzando le
            funzionalità offerte dalla Piattaforma. In caso di cessazione dell&apos;Account, i dati
            saranno gestiti secondo quanto previsto dalla Privacy Policy, dalla normativa applicabile
            e dagli eventuali obblighi legali di conservazione.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">19. Sospensione dell&apos;Account</h2>
          <p className="mt-2">
            INCASSA potrà sospendere o limitare l&apos;accesso all&apos;Account quando ciò sia
            ragionevolmente necessario, in particolare in caso di: violazione grave dei presenti
            Termini; utilizzo fraudolento o illecito; rischio per la sicurezza della Piattaforma, di
            altri tenant o di altri utenti; mancato pagamento; oppure obbligo imposto dalla legge o
            da un&apos;autorità competente.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">20. Responsabilità</h2>
          <p className="mt-2">
            INCASSA fornisce uno strumento tecnologico di supporto alla gestione dell&apos;attività
            del Ristorante. INCASSA non garantisce la ricezione dei pagamenti degli ordini, la
            validità fiscale dei documenti generati tramite il modulo fiscale descritto all&apos;art.
            11, né il successo commerciale del Ristorante.
          </p>
          <p className="mt-2">
            <strong>Esattezza dei dati inseriti.</strong> Il Ristorante è l&apos;unico responsabile
            dell&apos;esattezza, completezza e aggiornamento dei dati che inserisce o raccoglie
            tramite il Servizio, inclusi prezzi, disponibilità, dati fiscali e dati dei Clienti
            Finali. INCASSA non verifica né garantisce la correttezza di tali dati.
          </p>
          <p className="mt-2">
            Nei confronti dei Titolari del Ristorante che agiscono nell&apos;ambito della propria
            attività imprenditoriale, e nei limiti consentiti dalla legge, INCASSA non risponde di
            danni indiretti, perdita di opportunità commerciali, mancato profitto o conseguenze
            derivanti da informazioni inesatte inserite dall&apos;Utente o dall&apos;utilizzo del
            Servizio in violazione dei presenti Termini.
          </p>
          <p className="mt-2">
            Nessuna limitazione o esclusione prevista dai presenti Termini opera nei casi in cui la
            responsabilità non possa essere esclusa o limitata per legge, né limita i diritti
            inderogabili spettanti al Consumatore.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">21. Manleva — Titolare del Ristorante</h2>
          <p className="mt-2">
            Nei limiti consentiti dalla legge, il Titolare del Ristorante che agisce nell&apos;ambito
            della propria attività imprenditoriale si impegna a tenere indenne INCASSA da pretese di
            terzi, inclusi i Clienti Finali, derivanti da un utilizzo illecito del Servizio
            imputabile al Ristorante, dall&apos;inserimento di dati che violino diritti di terzi,
            dalla mancata evasione o dalla qualità degli ordini, o dal mancato rispetto degli
            obblighi fiscali propri del Ristorante.
          </p>
          <p className="mt-2">
            La presente disposizione non si applica nella misura in cui il danno sia imputabile a
            INCASSA.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">22. Assistenza</h2>
          <p className="mt-2">
            Le richieste di assistenza possono essere inviate a{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">23. Modifiche dei Termini</h2>
          <p className="mt-2">
            INCASSA può modificare i presenti Termini per esigenze normative, tecniche, di sicurezza
            o per modifiche sostanziali del Servizio. Quando richiesto dalla legge o quando la
            modifica incida significativamente sul rapporto contrattuale in corso, l&apos;Utente
            sarà informato con congruo preavviso.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">24. Legge applicabile</h2>
          <p className="mt-2">
            I presenti Termini sono regolati dalla legge italiana, indipendentemente dal paese in
            cui il Ristorante o i suoi Clienti Finali sono stabiliti o residenti. Per il Consumatore,
            restano impregiudicate le disposizioni imperative di tutela applicabili e ogni foro
            inderogabile previsto dalla normativa. Per gli Utenti che agiscono nell&apos;ambito
            della propria attività imprenditoriale, il foro competente è quello di Catanzaro, salvo
            diversa disposizione inderogabile di legge.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">25. Nullità parziale</h2>
          <p className="mt-2">
            Qualora una disposizione dei presenti Termini sia dichiarata invalida, inefficace o
            inapplicabile, le restanti disposizioni continueranno ad avere efficacia nella misura
            consentita dalla legge.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">26. Contatti</h2>
          <p className="mt-2">
            Per domande relative ai presenti Termini: INCASSA — E-mail:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>{" "}
            — PEC:{" "}
            <a href={`mailto:${PEC_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {PEC_EMAIL}
            </a>{" "}
            — Sede: Catanzaro, Italia.
          </p>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-base font-semibold text-stone-900">
            Approvazione specifica ex artt. 1341 e 1342 c.c.
          </h2>
          <p className="mt-2">
            Ai sensi e per gli effetti degli artt. 1341 e 1342 del Codice Civile, l&apos;Utente
            dichiara di aver letto attentamente e di approvare specificamente le seguenti clausole:
            art. 9 (durata, rinnovo e cancellazione); art. 11 (modulo fiscale — stato attuale e
            limiti); art. 12 (dati inseriti dal Ristorante e dai Clienti Finali); art. 14
            (disponibilità del Servizio); art. 15 (modifiche del Servizio); art. 19 (sospensione
            dell&apos;Account); art. 20 (limitazioni di responsabilità); art. 21 (manleva); art. 23
            (modifiche dei Termini); art. 24 (legge applicabile e foro competente).
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Questa approvazione specifica viene richiesta separatamente in fase di creazione
            dell&apos;account, quando applicabile.
          </p>
        </section>
      </div>
    </main>
  );
}
