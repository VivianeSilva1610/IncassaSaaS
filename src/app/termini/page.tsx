import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termini e Condizioni — INCASSA",
};

const SUPPORT_EMAIL = "viverevivi37@gmail.com";
const PEC_EMAIL = "supporto@pec.incassa.eu";
const LAST_UPDATED = "8 settembre 2026";

export default function TerminiPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-stone-700">
      <Link href="/" className="text-sm text-amber-700 underline underline-offset-2">
        ← Torna alla home
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">Termini e Condizioni di Servizio</h1>
      <p className="mt-1 text-sm text-stone-400">Ultimo aggiornamento: {LAST_UPDATED}</p>
      <p className="mt-2 text-sm text-stone-500">
        I presenti Termini e Condizioni (&quot;Termini&quot;) disciplinano l&apos;accesso e
        l&apos;utilizzo della piattaforma INCASSA, disponibile sul sito incassa.eu, nonché
        l&apos;acquisto degli eventuali prodotti digitali denominati &quot;Kit Incassa&quot;.
        L&apos;utilizzo dei Servizi comporta l&apos;accettazione dei presenti Termini secondo le
        modalità indicate durante la registrazione o l&apos;acquisto.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-stone-900">1. Titolare del Servizio</h2>
          <p className="mt-2">
            Il Servizio INCASSA è fornito da Viviane Silva, persona fisica, con sede a Catanzaro,
            Italia (di seguito &quot;INCASSA&quot;, &quot;Fornitore&quot; o &quot;Titolare&quot;).
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
          <p className="mt-2">Ai fini dei presenti Termini:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>&quot;INCASSA&quot;</strong> o <strong>&quot;Piattaforma&quot;</strong> indica
              il software accessibile online messo a disposizione dal Fornitore.
            </li>
            <li>
              <strong>&quot;Servizio&quot;</strong> indica le funzionalità SaaS rese disponibili
              attraverso INCASSA.
            </li>
            <li>
              <strong>&quot;Utente&quot;</strong> indica qualsiasi persona fisica o giuridica che
              accede o utilizza INCASSA.
            </li>
            <li>
              <strong>&quot;Consumatore&quot;</strong> indica la persona fisica che agisce per scopi
              estranei alla propria attività imprenditoriale, commerciale, artigianale o
              professionale, secondo la normativa applicabile.
            </li>
            <li>
              <strong>&quot;Utente Professionale&quot;</strong> indica il soggetto che utilizza
              INCASSA nell&apos;ambito della propria attività imprenditoriale, commerciale,
              artigianale o professionale.
            </li>
            <li>
              <strong>&quot;Account&quot;</strong> indica l&apos;area personale dell&apos;Utente.
            </li>
            <li>
              <strong>&quot;Abbonamento&quot;</strong> indica il piano a pagamento che consente
              l&apos;accesso alle funzionalità previste dal relativo piano.
            </li>
            <li>
              <strong>&quot;Kit Incassa&quot;</strong> indica eventuali materiali o contenuti
              digitali acquistabili separatamente.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">3. Oggetto del Servizio</h2>
          <p className="mt-2">
            INCASSA è una piattaforma digitale progettata per facilitare l&apos;organizzazione e il
            monitoraggio di fatture, crediti, scadenze, pagamenti e attività di sollecito.
          </p>
          <p className="mt-2">
            A seconda del piano e delle funzionalità disponibili, la Piattaforma può consentire, a
            titolo esemplificativo: registrazione e gestione delle informazioni relative alle
            fatture; monitoraggio delle scadenze; indicazione delle fatture pagate, scadute o ancora
            da incassare; gestione delle informazioni relative ai clienti; predisposizione e/o
            gestione di solleciti di pagamento; automazione di determinate attività;
            visualizzazione di dashboard, statistiche o report; utilizzo di funzionalità assistite
            da sistemi automatizzati o di intelligenza artificiale, ove disponibili.
          </p>
          <p className="mt-2">
            INCASSA costituisce uno strumento organizzativo e gestionale. INCASSA non è una banca,
            un istituto di pagamento, un intermediario finanziario, un&apos;agenzia di recupero
            crediti, uno studio legale o un commercialista e non fornisce consulenza legale, fiscale,
            contabile o finanziaria.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">4. Registrazione e Account</h2>
          <p className="mt-2">
            Per utilizzare determinate funzionalità, l&apos;Utente deve creare un Account fornendo
            informazioni corrette, complete e aggiornate.
          </p>
          <p className="mt-2">
            L&apos;Utente è responsabile della custodia delle proprie credenziali e delle attività
            effettuate attraverso il proprio Account. Le credenziali sono personali e non devono
            essere cedute a terzi, salvo eventuali funzionalità espressamente previste dal piano
            sottoscritto.
          </p>
          <p className="mt-2">
            L&apos;Utente dovrà informare tempestivamente INCASSA in caso di accesso non autorizzato
            o sospetta compromissione dell&apos;Account. INCASSA potrà adottare misure ragionevoli
            di sicurezza, compresa la sospensione temporanea dell&apos;accesso, qualora rilevi
            attività potenzialmente fraudolente o rischiose.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">5. Abbonamenti e prezzi</h2>
          <p className="mt-2">
            Alcune funzionalità di INCASSA possono essere subordinate alla sottoscrizione di un
            Abbonamento. Prezzo, periodicità, funzionalità incluse e condizioni economiche
            applicabili sono indicate chiaramente prima della conclusione dell&apos;acquisto. Il
            prezzo visualizzato al momento dell&apos;ordine costituisce il prezzo applicabile
            all&apos;Abbonamento acquistato, salvo errori manifesti.
          </p>
          <p className="mt-2">
            Prima della conclusione del contratto, l&apos;Utente viene informato della durata
            dell&apos;Abbonamento e dell&apos;eventuale rinnovo automatico.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">6. Pagamenti</h2>
          <p className="mt-2">
            I pagamenti possono essere gestiti attraverso fornitori esterni di servizi di pagamento
            indicati durante il checkout. INCASSA non conserva direttamente i dati completi delle
            carte di pagamento quando il pagamento è elaborato dal provider esterno. L&apos;Utente è
            responsabile di fornire informazioni di pagamento valide e aggiornate.
          </p>
          <p className="mt-2">
            In caso di pagamento rifiutato, scaduto o non completato, INCASSA potrà richiedere
            l&apos;aggiornamento del metodo di pagamento e, dopo adeguata comunicazione ove
            richiesta, limitare o sospendere l&apos;accesso alle funzionalità a pagamento.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">7. Durata, rinnovo e cancellazione</h2>
          <p className="mt-2">
            La durata dell&apos;Abbonamento è quella indicata al momento dell&apos;acquisto. Qualora
            il piano preveda rinnovo automatico, l&apos;Abbonamento sarà rinnovato secondo la
            periodicità indicata nel checkout, salvo cancellazione effettuata prima del rinnovo
            secondo le modalità rese disponibili all&apos;Utente.
          </p>
          <p className="mt-2">
            L&apos;Utente può disattivare il rinnovo automatico attraverso le funzionalità
            disponibili nel proprio Account oppure attraverso gli ulteriori canali indicati da
            INCASSA.
          </p>
          <p className="mt-2">
            Salvo diversa indicazione o diritto inderogabile previsto dalla legge, la cancellazione
            impedisce i rinnovi successivi ma non determina automaticamente il rimborso del periodo
            già pagato. L&apos;Utente continuerà ad avere accesso alle funzionalità previste dal
            proprio piano fino alla scadenza del periodo già corrisposto, salvo sospensione
            legittima prevista dai presenti Termini.
          </p>
          <p className="mt-2">
            La cancellazione dell&apos;Abbonamento non coincide con l&apos;esercizio del diritto
            legale di recesso, ove quest&apos;ultimo sia applicabile (si veda l&apos;art. 8).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">
            8. Diritto di recesso del Consumatore
          </h2>
          <p className="mt-2">
            <strong>8.1 Termine di 14 giorni.</strong> Qualora l&apos;Utente rivesta la qualifica di
            Consumatore, per i contratti conclusi a distanza dispone, salvo le eccezioni previste
            dalla legge, di 14 giorni per recedere dal contratto senza dover fornire alcuna
            motivazione. Per i contratti di servizi, il termine decorre dalla conclusione del
            contratto. La disciplina deriva dagli artt. 52 e seguenti del Codice del Consumo.
          </p>
          <p className="mt-2">
            <strong>8.2 Inizio del Servizio durante il periodo di recesso.</strong> Qualora il
            Consumatore desideri utilizzare INCASSA immediatamente, prima della scadenza del
            periodo di recesso, potrà richiedere espressamente che l&apos;esecuzione del Servizio
            abbia inizio durante tale periodo. L&apos;inizio immediato del Servizio non determina
            automaticamente la perdita del diritto di recesso. Nei casi previsti dalla legge,
            qualora il Consumatore eserciti il recesso dopo aver espressamente richiesto l&apos;inizio
            della prestazione, potrà essere tenuto al pagamento di un importo proporzionale rispetto
            a quanto fornito fino al momento del recesso. La perdita del diritto di recesso per un
            contratto di servizi soggetto a pagamento può verificarsi, nei termini dell&apos;art.
            59, dopo la completa esecuzione e se sono soddisfatti i requisiti di consenso e
            riconoscimento previsti dalla norma.
          </p>
          <p className="mt-2">
            <strong>8.3 Come esercitare il recesso.</strong> Il Consumatore può comunicare la
            propria decisione di recedere mediante dichiarazione esplicita inviata a{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            , indicando almeno i dati necessari a identificare l&apos;Utente e il contratto. Il
            Consumatore può utilizzare anche il modulo tipo di recesso previsto dalla normativa
            applicabile, senza che ciò sia obbligatorio.
          </p>
          <p className="mt-2">
            <strong>8.4 Funzione di recesso online.</strong> Per i contratti a distanza conclusi
            mediante interfaccia online, INCASSA mette a disposizione del Consumatore, nei casi e
            nei termini previsti dalla normativa applicabile, una funzione online facilmente
            accessibile per esercitare il diritto di recesso, raggiungibile in ogni momento alla
            pagina{" "}
            <Link href="/recesso" className="text-amber-700 underline underline-offset-2">
              incassa.eu/recesso
            </Link>
            . Dopo la conferma del recesso online, INCASSA invierà senza indebito ritardo una
            conferma su supporto durevole (email) contenente le informazioni previste dalla legge.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">9. Kit Incassa e contenuti digitali</h2>
          <p className="mt-2">
            Ove disponibile, il Kit Incassa può essere acquistato separatamente dal Servizio SaaS.
            Il Kit può comprendere file, modelli, guide, documenti o altri contenuti digitali.
          </p>
          <p className="mt-2">
            Quando il Kit costituisce contenuto digitale fornito mediante supporto non materiale,
            l&apos;esecuzione può iniziare immediatamente dopo l&apos;acquisto. Quando previsto
            dalla legge, prima dell&apos;inizio immediato della fornitura viene richiesto al
            Consumatore il previo consenso espresso all&apos;inizio della fornitura durante il
            periodo di recesso e il riconoscimento della conseguente perdita del diritto di recesso,
            e viene fornita la relativa conferma prevista dalla normativa applicabile. L&apos;art.
            59, lett. o), del Codice del Consumo collega infatti l&apos;eccezione per contenuto
            digitale non materiale a specifiche condizioni, tra cui consenso espresso,
            riconoscimento della perdita del diritto e conferma.
          </p>
          <p className="mt-2">
            Indipendentemente da quanto sopra, per il Kit Incassa offriamo comunque una garanzia
            commerciale volontaria: se il Kit Incassa non fa per te, puoi richiedere il rimborso
            completo entro 7 giorni dall&apos;acquisto scrivendo a{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-700 underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            , senza necessità di motivazione.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">
            10. Fatture, crediti e dati inseriti dall&apos;Utente
          </h2>
          <p className="mt-2">
            INCASSA non verifica automaticamente l&apos;esistenza, validità, esigibilità o
            correttezza giuridica delle fatture o dei crediti registrati dall&apos;Utente, salvo ove
            espressamente indicato per una specifica funzionalità.
          </p>
          <p className="mt-2">
            L&apos;Utente è responsabile delle informazioni inserite nella Piattaforma e deve
            verificare che siano corrette e aggiornate. Lo stato visualizzato di fatture, pagamenti
            o crediti dipende anche dai dati disponibili e dalle informazioni fornite o confermate
            dall&apos;Utente e/o da eventuali integrazioni attive.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">11. Solleciti di pagamento</h2>
          <p className="mt-2">
            INCASSA può mettere a disposizione strumenti per predisporre, programmare o gestire
            comunicazioni relative a pagamenti e fatture. L&apos;Utente è responsabile di
            verificare, prima dell&apos;utilizzo, la correttezza del destinatario, dell&apos;importo,
            della scadenza e delle altre informazioni rilevanti.
          </p>
          <p className="mt-2">
            L&apos;Utente deve utilizzare le funzionalità di sollecito nel rispetto della legge, dei
            diritti dei destinatari e delle regole applicabili alle comunicazioni commerciali e
            contrattuali. INCASSA non garantisce che l&apos;invio di un sollecito determini il
            pagamento di una fattura.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">12. Automazioni e intelligenza artificiale</h2>
          <p className="mt-2">
            Alcune funzionalità di INCASSA possono utilizzare sistemi automatizzati o tecnologie di
            intelligenza artificiale. Tali strumenti possono, ad esempio, assistere nella
            generazione, organizzazione, classificazione o elaborazione di informazioni e
            comunicazioni.
          </p>
          <p className="mt-2">
            Gli output generati automaticamente possono contenere errori, omissioni o informazioni
            non adeguate allo specifico contesto dell&apos;Utente. L&apos;Utente deve pertanto
            verificare le informazioni rilevanti prima di utilizzarle per decisioni professionali,
            finanziarie, fiscali o legali. INCASSA non sostituisce il giudizio professionale
            dell&apos;Utente né quello di commercialisti, consulenti fiscali, avvocati o altri
            professionisti qualificati.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">13. Utilizzo consentito</h2>
          <p className="mt-2">L&apos;Utente si impegna a non utilizzare INCASSA:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>per attività illecite o fraudolente;</li>
            <li>per molestare, minacciare o ingannare terzi;</li>
            <li>per inviare comunicazioni illegittime;</li>
            <li>per inserire intenzionalmente informazioni false;</li>
            <li>per compromettere sicurezza, disponibilità o integrità della Piattaforma;</li>
            <li>per tentare accessi non autorizzati;</li>
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
            problemi tecnici, servizi di terzi, eventi di forza maggiore o esigenze di sicurezza.
          </p>
          <p className="mt-2">
            Nessuna disposizione dei presenti Termini esclude o limita diritti inderogabili
            riconosciuti al Consumatore, comprese le garanzie legali applicabili ai servizi e
            contenuti digitali.
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
            di proprietà intellettuale.
          </p>
          <p className="mt-2">
            La sottoscrizione dell&apos;Abbonamento concede esclusivamente un diritto personale,
            limitato, non esclusivo e non trasferibile di utilizzare il Servizio secondo i presenti
            Termini. Non viene trasferito all&apos;Utente alcun diritto di proprietà sul software.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">17. Dati dell&apos;Utente</h2>
          <p className="mt-2">
            L&apos;Utente mantiene i diritti sui dati e contenuti propri inseriti nella Piattaforma.
            L&apos;Utente concede a INCASSA le autorizzazioni tecniche strettamente necessarie a
            ospitare, elaborare, trasmettere e trattare tali dati nella misura necessaria
            all&apos;erogazione del Servizio e secondo la normativa applicabile.
          </p>
          <p className="mt-2">
            Il trattamento dei dati personali è disciplinato dalla{" "}
            <Link href="/privacy" className="text-amber-700 underline underline-offset-2">
              Informativa sulla Privacy
            </Link>{" "}
            di INCASSA e, quando necessario per rapporti B2B o trattamenti per conto
            dell&apos;Utente, dagli eventuali ulteriori accordi applicabili.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">18. Esportazione e cancellazione dei dati</h2>
          <p className="mt-2">
            Ove tecnicamente disponibile e previsto dal Servizio, l&apos;Utente potrà esportare i
            propri dati utilizzando le funzionalità offerte dalla Piattaforma.
          </p>
          <p className="mt-2">
            In caso di cessazione dell&apos;Account, i dati saranno gestiti secondo quanto previsto
            dalla Privacy Policy, dalla normativa applicabile e dagli eventuali obblighi legali di
            conservazione. La cessazione del Servizio non determina necessariamente la cancellazione
            immediata di ogni informazione qualora la conservazione sia necessaria per obblighi
            legali, sicurezza, contabilità, contestazioni o tutela di diritti.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">19. Sospensione dell&apos;Account</h2>
          <p className="mt-2">
            INCASSA potrà sospendere o limitare l&apos;accesso all&apos;Account quando ciò sia
            ragionevolmente necessario, in particolare in caso di: violazione grave dei presenti
            Termini; utilizzo fraudolento o illecito; rischio per la sicurezza della Piattaforma o
            di altri utenti; mancato pagamento; oppure obbligo imposto dalla legge o da
            un&apos;autorità competente.
          </p>
          <p className="mt-2">
            Quando possibile e salvo esigenze urgenti, di sicurezza o obblighi legali, l&apos;Utente
            verrà informato della sospensione e delle relative ragioni.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">20. Responsabilità</h2>
          <p className="mt-2">
            INCASSA fornisce uno strumento tecnologico di supporto alla gestione dell&apos;attività
            dell&apos;Utente. INCASSA non garantisce il pagamento delle fatture né il recupero dei
            crediti registrati nella Piattaforma. INCASSA non è responsabile della solvibilità dei
            clienti dell&apos;Utente né delle decisioni commerciali adottate sulla base dei dati
            presenti nella Piattaforma.
          </p>
          <p className="mt-2">
            <strong>Esattezza dei dati inseriti.</strong> L&apos;utente è l&apos;unico responsabile
            dell&apos;esattezza, completezza e aggiornamento dei dati che inserisce nel Servizio,
            inclusi — a titolo esemplificativo — nome e contatti dei propri clienti, importi delle
            fatture, date di scadenza e stato dei pagamenti. INCASSA non verifica né garantisce la
            correttezza di tali dati e non è responsabile per solleciti errati, indebiti o
            imbarazzanti generati o inviati a causa di dati inesatti, incompleti o non aggiornati
            forniti dall&apos;utente. È responsabilità dell&apos;utente aggiornare tempestivamente
            lo stato delle fatture (ad esempio segnandole come pagate) per evitare l&apos;invio di
            solleciti non dovuti.
          </p>
          <p className="mt-2">
            <strong>Contenuto e invio dei solleciti.</strong> L&apos;utente è l&apos;unico
            responsabile del contenuto, del tono e delle conseguenze di ciascun messaggio di
            sollecito inviato ai propri clienti tramite INCASSA — sia che il messaggio sia stato
            generato tramite intelligenza artificiale, modificato dall&apos;utente e inviato
            manualmente, sia che sia stato inviato automaticamente tramite la funzione opzionale di
            invio automatico attivata dall&apos;utente. L&apos;utente riconosce e accetta che, una
            volta attivata, la funzione di invio automatico genera e invia i messaggi sulla base
            dei dati presenti nel proprio account, <strong>senza revisione umana preventiva</strong>{" "}
            da parte dell&apos;utente prima dell&apos;invio, e che tale invio è una conseguenza
            diretta della configurazione da lui scelta e dei dati da lui inseriti o non aggiornati.
            L&apos;utente può in qualsiasi momento rivedere, modificare, sospendere o disattivare la
            funzione di invio automatico dalle impostazioni del proprio account, e resta l&apos;unico
            responsabile di verificare che i messaggi inviati — automaticamente o manualmente —
            rispettino le leggi applicabili alle proprie comunicazioni commerciali e di recupero
            crediti (incluse, a titolo esemplificativo, le norme in materia di tutela del
            consumatore, comunicazioni commerciali indesiderate e trattamento dei dati personali
            dei propri clienti).
          </p>
          <p className="mt-2">
            Nei confronti degli Utenti Professionali e nei limiti consentiti dalla legge, INCASSA
            non risponde di danni indiretti, perdita di opportunità commerciali, mancato profitto o
            conseguenze derivanti da informazioni inesatte inserite dall&apos;Utente o
            dall&apos;utilizzo del Servizio in violazione dei presenti Termini.
          </p>
          <p className="mt-2">
            Nessuna limitazione o esclusione prevista dai presenti Termini opera nei casi in cui la
            responsabilità non possa essere esclusa o limitata per legge. In particolare, nulla nei
            presenti Termini limita i diritti inderogabili spettanti al Consumatore.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">21. Manleva — Utenti Professionali</h2>
          <p className="mt-2">
            Nei limiti consentiti dalla legge, l&apos;Utente Professionale si impegna a tenere
            indenne INCASSA da pretese di terzi derivanti da un utilizzo illecito del Servizio
            imputabile all&apos;Utente, dall&apos;inserimento di dati che violino diritti di terzi o
            dall&apos;invio di comunicazioni illegittime attraverso gli strumenti messi a
            disposizione dalla Piattaforma, nonché da dati inesatti, incompleti o non aggiornati
            inseriti nel Servizio e dal contenuto, tono o conseguenze dei solleciti inviati ai
            propri clienti, manualmente o tramite la funzione di invio automatico.
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
            . INCASSA cercherà di gestire le richieste entro tempi ragionevoli in relazione alla
            loro natura e complessità.
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
          <p className="mt-2">
            Le modifiche non limiteranno retroattivamente diritti già maturati dall&apos;Utente,
            salvo quando consentito dalla legge.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-stone-900">24. Legge applicabile</h2>
          <p className="mt-2">
            I presenti Termini sono regolati dalla legge italiana. Per il Consumatore, restano
            impregiudicate le disposizioni imperative di tutela applicabili e ogni foro inderogabile
            previsto dalla normativa. Per gli Utenti Professionali, il foro competente è quello di
            Catanzaro, salvo diversa disposizione inderogabile di legge.
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
            art. 7 (durata, rinnovo e cancellazione); art. 10 e art. 11 (dati inseriti
            dall&apos;Utente e solleciti); art. 12 (automazioni e intelligenza artificiale); art. 14
            (disponibilità del Servizio); art. 15 (modifiche del Servizio); art. 19 (sospensione
            dell&apos;Account); art. 20 (limitazioni di responsabilità); art. 21 (manleva); art. 23
            (modifiche dei Termini); art. 24 (legge applicabile e foro competente).
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Questa approvazione specifica viene richiesta separatamente in fase di creazione
            dell&apos;account o di acquisto, quando applicabile.
          </p>
        </section>
      </div>
    </main>
  );
}
