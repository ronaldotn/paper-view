interface PatternPosition {
	index: number;
	level: number;
}

interface LanguagePatterns {
	patterns: string;
	exceptions: Record<string, string>;
}

interface HyphenateOptions {
	hyphenCharacter?: string;
	minWordLength?: number;
	minCharsBefore?: number;
	minCharsAfter?: number;
}

const HYPHENATION_PATTERNS: Record<string, LanguagePatterns> = {
	en: {
		patterns: "ti5tle1ab3er5a2b ab3c4 ant4i5 an4ti5 un4de5r2 un3der3 co4op5 er5r ing4ly3 ous3ly3 ment4 al4ly3 ful4ly3 ness4 tion4 sion4 ous4 able4 ible4 ence4 ance4 ize4 ise4 ise4 ent4 est4 ing4 ed4 er4 ly4 ty4 ity4 ment4 ness4 less4 ful4 ous4 ive4 able4 ible4 al4 ic4 id4 ous4 tive4 sive4 tive4 ative4 itive4 ize4 ise4 ize4 ical4 istic4 istic4 istic5 istics4 istic4 istics4 istic4 istic4 istic4 istic4 istic4 istic4 istic4 istic4",
		exceptions: {
			"every": "ev-ery",
			"interesting": "in-ter-est-ing",
			"beautiful": "beau-ti-ful",
			"necessary": "nec-es-sa-ry",
			"environment": "en-vi-ron-ment",
			"development": "de-vel-op-ment",
			"government": "gov-ern-ment",
			"understand": "un-der-stand",
			"international": "in-ter-na-tion-al",
			"information": "in-for-ma-tion",
			"communication": "com-mu-ni-ca-tion",
			"technology": "tech-nol-o-gy",
			"particularly": "par-tic-u-lar-ly",
			"especially": "es-pe-cial-ly",
			"experience": "ex-pe-ri-ence",
			"knowledge": "knowl-edge",
			"important": "im-por-tant",
			"significant": "sig-nif-i-cant",
			"appropriate": "ap-pro-pri-ate",
			"opportunity": "op-por-tu-ni-ty",
			"responsibility": "re-spon-si-bil-i-ty",
			"characteristic": "char-ac-ter-is-tic",
			"extraordinary": "ex-tra-or-di-nar-y",
			"contemporary": "con-tem-po-rar-y",
			"revolutionary": "rev-o-lu-tion-ar-y",
			"representative": "rep-re-sen-ta-tive",
			"approximately": "ap-prox-i-mate-ly",
			"unfortunately": "un-for-tu-nate-ly",
			"nevertheless": "nev-er-the-less",
			"notwithstanding": "not-with-stand-ing",
			"accommodate": "ac-com-mo-date",
			"accommodation": "ac-com-mo-da-tion",
			"achievement": "a-chieve-ment",
			"acknowledge": "ac-knowl-edge",
			"acquisition": "ac-qui-si-tion",
			"administration": "ad-min-is-tra-tion",
			"advantageous": "ad-van-ta-geous",
			"advertisement": "ad-ver-tise-ment",
			"agricultural": "ag-ri-cul-tur-al",
			"anniversary": "an-ni-ver-sar-y",
			"anticipate": "an-tic-i-pate",
			"appreciation": "ap-pre-ci-a-tion",
			"architecture": "ar-chi-tec-ture",
			"atmosphere": "at-mos-phere",
			"authorization": "au-thor-i-za-tion",
			"autobiography": "au-to-bi-og-ra-phy",
			"biodiversity": "bio-di-ver-si-ty",
			"biotechnology": "bi-o-tech-nol-o-gy",
			"bureaucracy": "bu-reau-cra-cy",
			"calculation": "cal-cu-la-tion",
			"camaraderie": "cam-a-rade-rie",
			"cartography": "car-tog-ra-phy",
			"catastrophe": "ca-tas-tro-phe",
			"categorize": "cat-e-go-rize",
			"celebration": "cel-e-bra-tion",
			"certification": "cer-ti-fi-ca-tion",
			"championship": "cham-pi-on-ship",
			"characterize": "char-ac-ter-ize",
			"chronological": "chro-no-log-i-cal",
			"circumstance": "cir-cum-stance",
			"civilization": "civ-i-li-za-tion",
			"collaboration": "col-lab-o-ra-tion",
			"commemorate": "com-mem-o-rate",
			"commissioner": "com-mis-sion-er",
			"commitment": "com-mit-ment",
			"commodity": "com-mod-i-ty",
			"communicate": "com-mu-ni-cate",
			"companion": "com-pan-ion",
			"comparison": "com-par-i-son",
			"compatibility": "com-pat-i-bil-i-ty",
			"compensation": "com-pen-sa-tion",
			"competition": "com-pe-ti-tion",
			"comprehensive": "com-pre-hen-sive",
			"compromise": "com-pro-mise",
			"computation": "com-pu-ta-tion",
			"concentration": "con-cen-tra-tion",
			"conceptual": "con-cep-tu-al",
			"confederation": "con-fed-er-a-tion",
			"configuration": "con-fig-u-ra-tion",
			"congratulate": "con-grat-u-late",
			"conscience": "con-science",
			"consciousness": "con-scious-ness",
			"consequence": "con-se-quence",
			"considerable": "con-sid-er-a-ble",
			"consistency": "con-sis-ten-cy",
			"constitution": "con-sti-tu-tion",
			"construction": "con-struc-tion",
			"consultation": "con-sul-ta-tion",
			"contemporary": "con-tem-po-rar-y",
			"controversy": "con-tro-ver-sy",
			"convenience": "con-ven-ience",
			"conversation": "con-ver-sa-tion",
			"cooperation": "co-op-er-a-tion",
			"coordination": "co-or-di-na-tion",
			"correspondence": "cor-re-spon-dence",
			"correspondent": "cor-re-spon-dent",
			"corruption": "cor-rup-tion",
			"councilor": "coun-cil-lor",
			"courageous": "cour-a-geous",
			"creativity": "cre-a-tiv-i-ty",
			"crystallize": "crys-tal-lize",
			"curriculum": "cur-ric-u-lum",
			"decoration": "dec-o-ra-tion",
			"democratic": "dem-o-crat-ic",
			"demonstrate": "dem-on-strate",
			"department": "de-part-ment",
			"depreciation": "de-pre-ci-a-tion",
			"description": "de-scrip-tion",
			"desirable": "de-sir-a-ble",
			"determination": "de-ter-mi-na-tion",
			"difference": "dif-fer-ence",
			"dimension": "di-men-sion",
			"diplomatic": "di-plo-mat-ic",
			"disadvantage": "dis-ad-van-tage",
			"disappear": "dis-ap-pear",
			"disappoint": "dis-ap-point",
			"disaster": "dis-as-ter",
			"discipline": "dis-ci-pline",
			"discover": "dis-cov-er",
			"discrimination": "dis-crim-i-na-tion",
			"discussion": "dis-cus-sion",
			"distribution": "dis-tri-bu-tion",
			"diversity": "di-ver-si-ty",
			"documentary": "doc-u-men-tar-y",
			"domination": "dom-i-na-tion",
			"ecological": "e-co-log-i-cal",
			"economic": "e-co-nom-ic",
			"education": "ed-u-ca-tion",
			"effectiveness": "ef-fec-tive-ness",
			"elaborate": "e-lab-o-rate",
			"electricity": "e-lec-tric-i-ty",
			"eliminate": "e-lim-i-nate",
			"embarrass": "em-bar-rass",
			"embarrassment": "em-bar-rass-ment",
			"emotional": "e-mo-tion-al",
			"emphasis": "em-pha-sis",
			"employee": "em-ploy-ee",
			"employment": "em-ploy-ment",
			"encyclopedia": "en-cy-clo-pe-di-a",
			"endeavor": "en-deav-or",
			"endorsement": "en-dorse-ment",
			"enforcement": "en-force-ment",
			"engineering": "en-gi-neer-ing",
			"entertainment": "en-ter-tain-ment",
			"enthusiasm": "en-thu-si-asm",
			"enthusiastic": "en-thu-si-as-tic",
			"entrepreneur": "en-tre-pre-neur",
			"environmental": "en-vi-ron-men-tal",
			"epidemiology": "ep-i-de-mi-ol-o-gy",
			"equilibrium": "e-qui-lib-ri-um",
			"equipment": "e-quip-ment",
			"establishment": "es-tab-lish-ment",
			"evaluation": "e-val-u-a-tion",
			"evolution": "ev-o-lu-tion",
			"exaggerate": "ex-ag-ger-ate",
			"examination": "ex-am-i-na-tion",
			"exceptional": "ex-cep-tion-al",
			"excitement": "ex-cite-ment",
			"exclamation": "ex-cla-ma-tion",
			"exhibition": "ex-hi-bi-tion",
			"existence": "ex-is-tence",
			"expectation": "ex-pec-ta-tion",
			"expedition": "ex-pe-di-tion",
			"experiment": "ex-per-i-ment",
			"explanation": "ex-pla-na-tion",
			"exploitation": "ex-ploi-ta-tion",
			"exploration": "ex-plora-tion",
			"explosion": "ex-plo-sion",
			"expression": "ex-pres-sion",
			"extraordinary": "ex-tra-or-di-nar-y",
			"facilitate": "fa-cil-i-tate",
			"familiarity": "fa-mil-i-ar-i-ty",
			"fascinating": "fas-ci-nat-ing",
			"fashionable": "fash-ion-a-ble",
			"favorable": "fa-vor-a-ble",
			"feasibility": "fea-si-bil-i-ty",
			"federation": "fed-er-a-tion",
			"fertilizer": "fer-til-iz-er",
			"flexibility": "flex-i-bil-i-ty",
			"flourishing": "flour-ish-ing",
			"forbidden": "for-bid-den",
			"forecast": "fore-cast",
			"foreseeable": "fore-see-a-ble",
			"formation": "for-ma-tion",
			"formidable": "for-mi-da-ble",
			"formulation": "for-mu-la-tion",
			"fortunately": "for-tu-nate-ly",
			"friendship": "friend-ship",
			"frustration": "frus-tra-tion",
			"fundamental": "fun-da-men-tal",
			"functionality": "func-tion-al-i-ty",
			"generation": "gen-er-a-tion",
			"geographical": "ge-o-graph-i-cal",
			"governmental": "gov-ern-men-tal",
			"graduation": "grad-u-a-tion",
			"guarantee": "guar-an-tee",
			"guideline": "guide-line",
			"happiness": "hap-pi-ness",
			"hierarchical": "hi-er-ar-chi-cal",
			"historical": "his-tor-i-cal",
			"hospitality": "hos-pi-tal-i-ty",
			"humanitarian": "hu-man-i-tar-i-an",
			"humorous": "hu-mor-ous",
			"hydroelectric": "hy-dro-e-lec-tric",
			"identification": "i-den-ti-fi-ca-tion",
			"ideological": "i-de-o-log-i-cal",
			"illustration": "il-lus-tra-tion",
			"imagination": "im-ag-i-na-tion",
			"immediate": "im-me-di-ate",
			"immigration": "im-mi-gra-tion",
			"implementation": "im-ple-men-ta-tion",
			"importance": "im-por-tance",
			"impossible": "im-pos-si-ble",
			"impression": "im-pres-sion",
			"improvement": "im-prove-ment",
			"inadequate": "in-ad-e-quate",
			"inappropriate": "in-ap-pro-pri-ate",
			"incredible": "in-cred-i-ble",
			"independence": "in-de-pend-ence",
			"indication": "in-di-ca-tion",
			"individual": "in-di-vid-u-al",
			"industrial": "in-dus-tri-al",
			"inevitable": "in-ev-i-ta-ble",
			"influence": "in-flu-ence",
			"information": "in-for-ma-tion",
			"infrastructure": "in-fra-struc-ture",
			"ingredient": "in-gre-di-ent",
			"inhabitant": "in-hab-i-tant",
			"inheritance": "in-her-i-tance",
			"initiative": "in-i-tia-tive",
			"innovation": "in-no-va-tion",
			"institution": "in-sti-tu-tion",
			"instruction": "in-struc-tion",
			"instrument": "in-stru-ment",
			"insufficient": "in-suf-fi-cient",
			"insurance": "in-sur-ance",
			"integration": "in-te-gra-tion",
			"intelligence": "in-tel-li-gence",
			"intelligent": "in-tel-li-gent",
			"intentional": "in-ten-tion-al",
			"interaction": "in-ter-ac-tion",
			"interference": "in-ter-fer-ence",
			"intermediate": "in-ter-me-di-ate",
			"international": "in-ter-na-tion-al",
			"interpretation": "in-ter-pre-ta-tion",
			"intervention": "in-ter-ven-tion",
			"introduction": "in-tro-duc-tion",
			"investigation": "in-ves-ti-ga-tion",
			"investment": "in-vest-ment",
			"invisible": "in-vis-i-ble",
			"invitation": "in-vi-ta-tion",
			"involvement": "in-volve-ment",
			"irregular": "ir-reg-u-lar",
			"irrelevant": "ir-rel-e-vant",
			"irresponsible": "ir-re-spon-si-ble",
			"judgment": "judg-ment",
			"jurisdiction": "ju-ris-dic-tion",
			"knowledgeable": "knowl-edge-a-ble",
			"laboratory": "lab-o-ra-to-ry",
			"landscape": "land-scape",
			"legislation": "leg-is-la-tion",
			"legitimate": "le-git-i-mate",
			"liberation": "lib-er-a-tion",
			"literature": "lit-er-a-ture",
			"loneliness": "lone-li-ness",
			"magnificent": "mag-nif-i-cent",
			"maintenance": "main-te-nance",
			"management": "man-age-ment",
			"manufacture": "man-u-fac-ture",
			"mathematics": "math-e-mat-ics",
			"measurement": "mea-sure-ment",
			"mechanism": "mech-a-nism",
			"memorable": "mem-o-ra-ble",
			"memorandum": "mem-o-ran-dum",
			"metamorphosis": "met-a-mor-pho-sis",
			"metropolitan": "met-ro-pol-i-tan",
			"microscopic": "mi-cro-scop-ic",
			"millennium": "mil-len-ni-um",
			"miniature": "min-i-a-ture",
			"minimization": "min-i-mi-za-tion",
			"ministry": "min-is-try",
			"miscellaneous": "mis-cel-la-ne-ous",
			"mischievous": "mis-chie-vous",
			"misunderstand": "mis-un-der-stand",
			"monitoring": "mon-i-tor-ing",
			"monumental": "mon-u-men-tal",
			"motivation": "mo-ti-va-tion",
			"mountainous": "moun-tain-ous",
			"multicultural": "mul-ti-cul-tur-al",
			"municipality": "mu-ni-cip-al-i-ty",
			"musician": "mu-si-cian",
			"mysterious": "mys-te-ri-ous",
			"mythological": "my-tho-log-i-cal",
			"narrative": "nar-ra-tive",
			"naturalist": "nat-u-ral-ist",
			"navigation": "nav-i-ga-tion",
			"negotiation": "ne-go-ti-a-tion",
			"neighborhood": "neigh-bor-hood",
			"nevertheless": "nev-er-the-less",
			"nonetheless": "non-e-the-less",
			"normalization": "nor-mal-i-za-tion",
			"notable": "no-ta-ble",
			"noteworthy": "note-wor-thy",
			"notion": "no-tion",
			"notorious": "no-to-ri-ous",
			"novelty": "nov-el-ty",
			"numerical": "nu-mer-i-cal",
			"nutrition": "nu-tri-tion",
			"objection": "ob-jec-tion",
			"obligation": "ob-li-ga-tion",
			"observation": "ob-ser-va-tion",
			"obstacle": "ob-sta-cle",
			"occasion": "oc-ca-sion",
			"occupation": "oc-cu-pa-tion",
			"occurrence": "oc-cur-rence",
			"official": "of-fi-cial",
			"omission": "omis-sion",
			"operation": "op-er-a-tion",
			"opportunity": "op-por-tu-ni-ty",
			"opposition": "op-po-si-tion",
			"optimistic": "op-ti-mis-tic",
			"organization": "or-gan-i-za-tion",
			"orientation": "o-ri-en-ta-tion",
			"original": "o-rig-i-nal",
			"ornamental": "or-na-men-tal",
			"otherwise": "oth-er-wise",
			"outstanding": "out-stand-ing",
			"overcome": "o-ver-come",
			"overestimate": "o-ver-es-ti-mate",
			"overwhelming": "o-whelm-ing",
			"parliament": "par-lia-ment",
			"particular": "par-tic-u-lar",
			"participation": "par-tic-i-pa-tion",
			"partnership": "part-ner-ship",
			"passionate": "pas-sion-ate",
			"patronage": "pa-tron-age",
			"perception": "per-cep-tion",
			"performance": "per-for-mance",
			"permanent": "per-ma-nent",
			"permission": "per-mis-sion",
			"perseverance": "per-se-ver-ance",
			"perspective": "per-spec-tive",
			"persuasion": "per-sua-sion",
			"pertinent": "per-ti-nent",
			"phenomenon": "phe-nom-e-non",
			"philosophical": "phi-lo-soph-i-cal",
			"photography": "pho-tog-ra-phy",
			"physiological": "phys-i-o-log-i-cal",
			"pilgrimage": "pil-grim-age",
			"plantation": "plan-ta-tion",
			"platform": "plat-form",
			"pleasurable": "plea-sur-a-ble",
			"politician": "pol-i-ti-cian",
			"population": "pop-u-la-tion",
			"portable": "port-a-ble",
			"portrait": "por-trait",
			"position": "po-si-tion",
			"possession": "pos-ses-sion",
			"possibility": "pos-si-bil-i-ty",
			"practically": "prac-ti-cal-ly",
			"pragmatic": "prag-mat-ic",
			"precaution": "pre-cau-tion",
			"preceding": "pre-ced-ing",
			"precision": "pre-ci-sion",
			"predictable": "pre-dict-a-ble",
			"predominant": "pre-dom-i-nant",
			"preference": "pref-er-ence",
			"prejudice": "prej-u-dice",
			"preliminary": "pre-lim-i-nar-y",
			"preparation": "prep-a-ra-tion",
			"prescription": "pre-scrip-tion",
			"presentation": "pres-en-ta-tion",
			"preservation": "pres-er-va-tion",
			"presidential": "pres-i-den-tial",
			"prestigious": "pres-ti-gious",
			"presumably": "pre-sum-a-bly",
			"pretension": "pre-ten-sion",
			"prevalence": "prev-a-lence",
			"prevention": "pre-ven-tion",
			"primarily": "pri-mar-i-ly",
			"principle": "prin-ci-ple",
			"privilege": "priv-i-lege",
			"probability": "prob-a-bil-i-ty",
			"procedure": "pro-ce-dure",
			"proceeding": "pro-ceed-ing",
			"processing": "pro-cess-ing",
			"production": "pro-duc-tion",
			"professional": "pro-fes-sion-al",
			"professor": "pro-fes-sor",
			"proficiency": "pro-fi-cien-cy",
			"profound": "pro-found",
			"progression": "pro-gres-sion",
			"prohibition": "pro-hi-bi-tion",
			"projection": "pro-jec-tion",
			"prominence": "prom-i-nence",
			"pronunciation": "pro-nun-ci-a-tion",
			"proposition": "prop-o-si-tion",
			"prospective": "pro-spec-tive",
			"prosperity": "pros-per-i-ty",
			"protection": "pro-tec-tion",
			"psychological": "psy-cho-log-i-cal",
			"publication": "pub-li-ca-tion",
			"punctuation": "punc-tu-a-tion",
			"punishment": "pun-ish-ment",
			"purchasing": "pur-chas-ing",
			"qualification": "qual-i-fi-ca-tion",
			"questionnaire": "ques-tion-naire",
			"radiation": "ra-di-a-tion",
			"realistic": "re-al-is-tic",
			"realization": "re-al-i-za-tion",
			"reasonable": "rea-son-a-ble",
			"rebellion": "re-bel-lion",
			"reception": "re-cep-tion",
			"recognition": "rec-og-ni-tion",
			"recommendation": "rec-om-men-da-tion",
			"reconciliation": "rec-on-cil-i-a-tion",
			"reconstruction": "re-con-struc-tion",
			"recollection": "rec-ol-lec-tion",
			"recreation": "rec-re-a-tion",
			"reduction": "re-duc-tion",
			"reference": "ref-er-ence",
			"reflection": "re-flec-tion",
			"reformation": "ref-or-ma-tion",
			"regulation": "reg-u-la-tion",
			"rehabilitation": "re-ha-bil-i-ta-tion",
			"relationship": "re-la-tion-ship",
			"relaxation": "re-lax-a-tion",
			"reluctant": "re-luc-tant",
			"remarkable": "re-mark-a-ble",
			"remembrance": "re-mem-brance",
			"reminiscence": "rem-i-nis-cence",
			"rendezvous": "ren-dez-vous",
			"renovation": "ren-o-va-tion",
			"reorganization": "re-or-gan-i-za-tion",
			"representation": "rep-re-sen-ta-tion",
			"reproduction": "re-pro-duc-tion",
			"reputation": "rep-u-ta-tion",
			"resemblance": "re-sem-blance",
			"reservation": "res-er-va-tion",
			"residence": "res-i-dence",
			"resignation": "res-ig-na-tion",
			"resistance": "re-sis-tance",
			"resolution": "res-o-lu-tion",
			"respective": "re-spec-tive",
			"responsibility": "re-spon-si-bil-i-ty",
			"restaurant": "res-tau-rant",
			"restitution": "res-ti-tu-tion",
			"restoration": "res-tora-tion",
			"restraint": "re-straint",
			"restriction": "re-stric-tion",
			"retirement": "re-tire-ment",
			"revelation": "rev-e-la-tion",
			"revolution": "rev-o-lu-tion",
			"righteous": "righ-teous",
			"romantic": "ro-man-tic",
			"rudimentary": "ru-di-men-tar-y",
			"sacrifice": "sac-ri-fice",
			"satisfaction": "sat-is-fac-tion",
			"satisfactory": "sat-is-fac-to-ry",
			"scapegoat": "scape-goat",
			"scholarship": "schol-ar-ship",
			"scientific": "sci-en-tif-ic",
			"screening": "screen-ing",
			"secretary": "sec-re-tar-y",
			"sedimentary": "sed-i-men-tar-y",
			"sensitivity": "sen-si-tiv-i-ty",
			"separation": "sep-a-ra-tion",
			"settlement": "set-tle-ment",
			"significance": "sig-nif-i-cance",
			"similarity": "sim-i-lar-i-ty",
			"simplicity": "sim-plic-i-ty",
			"simultaneous": "si-mul-ta-ne-ous",
			"situation": "sit-u-a-tion",
			"sophisticated": "so-phis-ti-cat-ed",
			"souvenir": "sou-ve-nir",
			"sovereignty": "sov-er-eign-ty",
			"specialist": "spe-cial-ist",
			"specification": "spec-i-fi-ca-tion",
			"spectacular": "spec-tac-u-lar",
			"speculation": "spec-u-la-tion",
			"spontaneous": "spon-ta-ne-ous",
			"stability": "sta-bil-i-ty",
			"statement": "state-ment",
			"statistical": "sta-tis-ti-cal",
			"stereotype": "ste-re-o-type",
			"stimulation": "stim-u-la-tion",
			"strategy": "strat-e-gy",
			"strength": "strength",
			"strengthen": "strength-en",
			"structure": "struc-ture",
			"subconscious": "sub-con-scious",
			"subordinate": "sub-or-di-nate",
			"subscription": "sub-scrip-tion",
			"subsequent": "sub-se-quent",
			"substantial": "sub-stan-tial",
			"substitute": "sub-sti-tute",
			"subterranean": "sub-ter-ra-ne-an",
			"sufficient": "suf-fi-cient",
			"superficial": "su-per-fi-cial",
			"superintendent": "su-per-in-ten-dent",
			"supplementary": "sup-ple-men-tar-y",
			"suppression": "sup-pres-sion",
			"supreme": "su-preme",
			"surrender": "sur-ren-der",
			"surveillance": "sur-veil-lance",
			"suspicion": "sus-pi-cion",
			"sustainable": "sus-tain-a-ble",
			"syllable": "syl-la-ble",
			"symmetrical": "sym-met-ri-cal",
			"symposium": "sym-po-si-um",
			"synchronize": "syn-chro-nize",
			"synthesis": "syn-the-sis",
			"systematic": "sys-tem-at-ic",
			"taxation": "tax-a-tion",
			"technician": "tech-ni-cian",
			"technological": "tech-no-log-i-cal",
			"temperament": "tem-per-a-ment",
			"temperature": "tem-per-a-ture",
			"temporary": "tem-po-rar-y",
			"temptation": "temp-ta-tion",
			"tendency": "ten-den-cy",
			"terminology": "ter-mi-nol-o-gy",
			"terrific": "ter-rif-ic",
			"territory": "ter-ri-to-ry",
			"testimony": "tes-ti-mo-ny",
			"thankful": "thank-ful",
			"theater": "the-a-ter",
			"theological": "the-o-log-i-cal",
			"theoretical": "the-o-ret-i-cal",
			"therapeutic": "ther-a-peu-tic",
			"threshold": "thresh-old",
			"throughout": "through-out",
			"tolerance": "tol-er-ance",
			"topography": "to-pog-ra-phy",
			"totalitarian": "to-tal-i-tar-i-an",
			"traditional": "tra-di-tion-al",
			"trajectory": "tra-jec-to-ry",
			"transaction": "trans-ac-tion",
			"transcend": "trans-cend",
			"transformation": "trans-for-ma-tion",
			"transition": "tran-si-tion",
			"translation": "trans-la-tion",
			"transmission": "trans-mis-sion",
			"transparency": "trans-par-en-cy",
			"transportation": "trans-por-ta-tion",
			"treasure": "treas-ure",
			"tremendous": "tre-men-dous",
			"tribulation": "trib-u-la-tion",
			"triumphant": "tri-um-phant",
			"tropical": "trop-i-cal",
			"turbulent": "tur-bu-lent",
			"typewriter": "type-writ-er",
			"typical": "typ-i-cal",
			"ubiquitous": "u-biq-ui-tous",
			"ultimately": "ul-ti-mate-ly",
			"unanimous": "u-nan-i-mous",
			"unbelievable": "un-be-liev-a-ble",
			"uncertainty": "un-cer-tain-ty",
			"uncomfortable": "un-com-fort-a-ble",
			"unconscious": "un-con-scious",
			"underestimate": "un-der-es-ti-mate",
			"undertake": "un-der-take",
			"underwear": "un-der-wear",
			"unemployment": "un-em-ploy-ment",
			"unexpected": "un-ex-pect-ed",
			"unfortunate": "un-for-tu-nate",
			"unification": "u-ni-fi-ca-tion",
			"unilateral": "u-ni-lat-er-al",
			"unimaginable": "un-i-mag-in-a-ble",
			"university": "u-ni-ver-si-ty",
			"unpleasant": "un-pleas-ant",
			"unprecedented": "un-pre-c-e-dent-ed",
			"unpredictable": "un-pre-dict-a-ble",
			"unreasonable": "un-rea-son-a-ble",
			"unrecognizable": "un-rec-og-niz-a-ble",
			"unsuccessful": "un-suc-cess-ful",
			"utilization": "u-til-i-za-tion",
			"vacation": "va-ca-tion",
			"validation": "val-i-da-tion",
			"valuable": "val-u-a-ble",
			"vegetation": "veg-e-ta-tion",
			"ventilation": "ven-ti-la-tion",
			"verification": "ver-i-fi-ca-tion",
			"versatile": "ver-sa-tile",
			"veterinarian": "vet-er-i-nar-i-an",
			"vicinity": "vi-cin-i-ty",
			"victorious": "vic-to-ri-ous",
			"vigorous": "vig-or-ous",
			"villain": "vil-lain",
			"violation": "vi-o-la-tion",
			"virtually": "vir-tu-al-ly",
			"visibility": "vis-i-bil-i-ty",
			"vocabulary": "vo-cab-u-lar-y",
			"vocation": "vo-ca-tion",
			"voluntary": "vol-un-tar-y",
			"vulnerable": "vul-ner-a-ble",
			"warrant": "war-rant",
			"wavelength": "wave-length",
			"weakness": "weak-ness",
			"wealthy": "wealth-y",
			"whereabouts": "where-a-bouts",
			"whereas": "where-as",
			"wherever": "wherev-er",
			"whisper": "whis-per",
			"widespread": "wide-spread",
			"willingness": "wil-ling-ness",
			"wonderful": "won-der-ful",
			"workshop": "work-shop",
			"worldwide": "world-wide",
			"worsening": "wors-en-ing",
			"worthwhile": "worth-while",
			"yesterday": "yes-ter-day"
		}
	},
	es: {
		patterns: "a2c3ion a3d3er al4mente an4cia3 an4cio3 an4cia4 ar4mente ble3men cio3nes dad4men dad4men3 e4men3 e3men3 en3tes es4men4 ica4men4 ico4men4 idad4mente il4men4 in4men3 is4men4 is3ta4mente ista4men3 ito4men3 ito3men4 ivo4men4 ivas4men3 ivo3men4 o3so4men o3sa4men osa4men3 oso4men4 u3men4 u4men3 ura4men3 ura3men4",
		exceptions: {
			"consideración": "con-si-de-ra-ción",
			"internacional": "in-ter-na-cio-nal",
			"comunicación": "co-mu-ni-ca-ción",
			"información": "in-for-ma-ción",
			"desarrollo": "de-sa-rro-llo",
			"importante": "im-por-tan-te",
			"gobierno": "go-bier-no",
			"educación": "e-du-ca-ción",
			"oportunidad": "o-por-tu-ni-dad",
			"responsabilidad": "res-pon-sa-bi-li-dad",
			"extraordinario": "ex-tra-or-di-na-rio",
			"especialmente": "es-pe-cial-men-te",
			"particularmente": "par-ti-cu-lar-men-te",
			"principalmente": "prin-ci-pal-men-te",
			"generalmente": "ge-ne-ral-men-te",
			"necesariamente": "ne-ce-sa-ria-men-te",
			"probablemente": "pro-ba-ble-men-te",
			"posiblemente": "po-si-ble-men-te",
			"definitivamente": "de-fi-ni-ti-va-men-te",
			"efectivamente": "e-fec-ti-va-men-te",
			"exactamente": "ex-ac-ta-men-te",
			"simplemente": "sim-ple-men-te",
			"únicamente": "ú-ni-ca-men-te",
			"solamente": "so-la-men-te",
			"realmente": "re-al-men-te",
			"verdaderamente": "ver-da-de-ra-men-te",
			"absolutamente": "ab-so-lu-ta-men-te",
			"completamente": "com-ple-ta-men-te",
			"totalmente": "to-tal-men-te",
			"claramente": "cla-ra-men-te",
			"evidentemente": "e-vi-den-te-men-te",
			"obviamente": "ob-via-men-te",
			"naturalmente": "na-tu-ral-men-te",
			"lógicamente": "ló-gi-ca-men-te",
			"rápidamente": "rá-pi-da-men-te",
			"lentamente": "len-ta-men-te",
			"fácilmente": "fá-cil-men-te",
			"difícilmente": "di-fí-cil-men-te",
			"correctamente": "co-rrec-ta-men-te",
			"incorrectamente": "in-co-rrec-ta-men-te",
			"perfectamente": "per-fec-ta-men-te",
			"precisamente": "pre-ci-sa-men-te",
			"específicamente": "es-pe-cí-fi-ca-men-te",
			"fundamentalmente": "fun-da-men-tal-men-te",
			"básicamente": "bá-si-ca-men-te",
			"esencialmente": "e-sen-cial-men-te",
			"primordialmente": "pri-mor-dial-men-te",
			"secundariamente": "se-cun-da-ria-men-te",
			"adicionalmente": "a-di-cio-nal-men-te",
			"extraordinariamente": "ex-tra-or-di-na-ria-men-te"
		}
	},
	fr: {
		patterns: "a2tion3 a3ment a4ment an4ment an3ment en3ment en4ment is4ment is3ment ique4ment ique3ment oire4ment oire3ment able4ment able3ment ible4ment ible3ment euse4ment euse3ment eux4ment eux3ment al4men3 al3men4 el4men3 el3men4",
		exceptions: {
			"considération": "con-si-dé-ra-tion",
			"international": "in-ter-na-tion-al",
			"communication": "com-mu-ni-ca-tion",
			"information": "in-for-ma-tion",
			"gouvernement": "gou-ver-ne-ment",
			"développement": "dé-ve-lop-pe-ment",
			"éducation": "é-du-ca-tion",
			"opportunité": "op-por-tu-ni-té",
			"responsabilité": "res-pon-sa-bi-li-té",
			"extraordinaire": "ex-tra-or-di-naire",
			"particulièrement": "par-ti-cu-liè-re-ment",
			"spécialement": "spé-ciale-ment",
			"principalement": "prin-ci-pale-ment",
			"généralement": "gé-né-rale-ment",
			"nécessairement": "né-ces-saire-ment",
			"probablement": "pro-ba-ble-ment",
			"possiblement": "pos-si-ble-ment",
			"définitivement": "dé-fi-ni-tive-ment",
			"effectivement": "ef-fec-tive-ment",
			"exactement": "ex-ac-te-ment",
			"simplement": "sim-ple-ment",
			"uniquement": "u-ni-que-ment",
			"seulement": "seu-le-ment",
			"réellement": "ré-el-le-ment",
			"véritablement": "vé-ri-ta-ble-ment",
			"absolument": "ab-so-lu-ment",
			"complètement": "com-plè-te-ment",
			"totalement": "to-tale-ment",
			"clairement": "claire-ment",
			"évidemment": "é-vi-dem-ment",
			"naturellement": "na-tu-rel-le-ment",
			"logiquement": "lo-gi-que-ment",
			"rapidement": "ra-pi-de-ment",
			"lentement": "len-te-ment",
			"facilement": "fa-ci-le-ment",
			"difficilement": "dif-fi-cile-ment",
			"correctement": "cor-rec-te-ment",
			"parfaitement": "par-fai-te-ment",
			"précisément": "pré-ci-sé-ment",
			"spécifiquement": "spé-ci-fi-que-ment",
			"fondamentalement": "fon-da-men-tale-ment",
			"essentiellement": "es-sen-tiel-le-ment",
			"actuellement": "ac-tu-el-le-ment",
			"également": "é-gale-ment",
			"éventuellement": "é-ven-tu-el-le-ment",
			"respectivement": "res-pec-tive-ment",
			"relativement": "re-la-tive-ment",
			"considérablement": "con-si-dé-ra-ble-ment",
			"environnement": "en-vi-ron-ne-ment",
			"compréhension": "com-pré-hen-sion",
			"reconnaissance": "re-con-nais-sance",
			"établissement": "é-tab-lis-se-ment",
			"représentation": "re-pré-sen-ta-tion",
			"administration": "ad-mi-nis-tra-tion",
			"organisation": "or-ga-ni-sa-tion",
			"amélioration": "a-mé-li-o-ra-tion",
			"transformation": "trans-for-ma-tion",
			"participation": "par-ti-ci-pa-tion",
			"collaboration": "col-lab-o-ra-tion",
			"documentation": "do-cu-men-ta-tion",
			"explication": "ex-pli-ca-tion",
			"préparation": "pré-pa-ra-tion",
			"présentation": "pré-sen-ta-tion",
			"production": "pro-duc-tion",
			"protection": "pro-tec-tion",
			"réalisation": "ré-a-li-sa-tion",
			"réduction": "ré-duc-tion",
			"réflexion": "ré-flex-ion",
			"régulation": "ré-gu-la-tion",
			"relation": "re-la-tion",
			"révolution": "ré-vo-lu-tion",
			"satisfaction": "sa-tis-fac-tion",
			"situation": "si-tu-a-tion",
			"traduction": "tra-duc-tion"
		}
	},
	de: {
		patterns: "a2tion3 a3lich a4lich an4lich en4lich er4lich heit4lich keit4lich un4lich ur4lich ig4lich is4lich os4lich sam4lich bar4lich haft4lich schaft4lich tum4lich",
		exceptions: {
			"Betrachtung": "Be-trach-tung",
			"international": "in-ter-na-tio-nal",
			"Kommunikation": "Kom-mu-ni-ka-tion",
			"Information": "In-for-ma-tion",
			"Regierung": "Re-gie-rung",
			"Entwicklung": "Ent-wick-lung",
			"Bildung": "Bil-dung",
			"Möglichkeit": "Mög-lich-keit",
			"Verantwortung": "Ver-ant-wor-tung",
			"außergewöhnlich": "au-ßer-ge-wöhn-lich",
			"besonders": "be-son-ders",
			"hauptsächlich": "haupt-säch-lich",
			"grundsätzlich": "grund-sätz-lich",
			"allgemein": "all-ge-mein",
			"notwendigerweise": "not-wen-di-ger-wei-se",
			"wahrscheinlich": "wahr-schein-lich",
			"möglicherweise": "mög-lich-er-wei-se",
			"endgültig": "end-gül-tig",
			"tatsächlich": "tat-säch-lich",
			"genau": "ge-nau",
			"einfach": "ein-fach",
			"nur": "nur",
			"ausschließlich": "aus-schließ-lich",
			"wirklich": "wirk-lich",
			"absolut": "ab-so-lut",
			"vollständig": "voll-stän-dig",
			"gänzlich": "gänz-lich",
			"klar": "klar",
			"offensichtlich": "of-fen-sicht-lich",
			"offenbar": "of-fen-bar",
			"natürlich": "na-tür-lich",
			"logischerweise": "lo-gi-scher-wei-se",
			"schnell": "schnell",
			"langsam": "lang-sam",
			"leicht": "leicht",
			"schwierig": "schwie-rig",
			"korrekt": "kor-rekt",
			"perfekt": "per-fekt",
			"präzise": "prä-zi-se",
			"spezifisch": "spe-zi-fisch",
			"grundlegend": "grund-le-gend",
			"wesentlich": "we-sent-lich",
			"derzeit": "der-zeit",
			"ebenfalls": "eben-falls",
			"gegebenenfalls": "ge-ge-be-nen-falls",
			"beziehungsweise": "be-zie-hungs-wei-se",
			"verhältnismäßig": "ver-hält-nis-mä-ßig",
			"vergleichsweise": "ver-gleichs-wei-se",
			"erheblich": "er-heb-lich",
			"Umwelt": "Um-welt",
			"Verständnis": "Ver-ständ-nis",
			"Anerkennung": "An-er-kennung",
			"Einrichtung": "Ein-rich-tung",
			"Darstellung": "Dar-stel-lung",
			"Verwaltung": "Ver-wal-tung",
			"Organisation": "Or-ga-ni-sa-tion",
			"Verbesserung": "Ver-bes-se-rung",
			"Umwandlung": "Um-wand-lung",
			"Beteiligung": "Be-tei-li-gung",
			"Zusammenarbeit": "Zu-sam-men-ar-beit",
			"Erläuterung": "Er-läu-te-rung",
			"Vorbereitung": "Vor-be-rei-tung",
			"Präsentation": "Prä-sen-ta-tion",
			"Produktion": "Pro-duk-tion",
			"Schutz": "Schutz",
			"Realisierung": "Re-a-li-sie-rung",
			"Reduzierung": "Re-du-zie-rung",
			"Überlegung": "Über-le-gung",
			"Regulierung": "Re-gu-lie-rung",
			"Beziehung": "Be-zie-hung",
			"Revolution": "Re-vo-lu-tion",
			"Zufriedenheit": "Zu-frie-den-heit",
			"Situation": "Si-tu-a-tion",
			"Übersetzung": "Über-set-zung"
		}
	},
	it: {
		patterns: "a2zione3 a3mente an4mente en4mente is4mente ica4mente ico4mente ile4mente ale4mente os4mente osa4mente ante4mente ente4mente",
		exceptions: {
			"considerazione": "con-si-de-ra-zio-ne",
			"internazionale": "in-ter-na-zio-na-le",
			"comunicazione": "co-mu-ni-ca-zio-ne",
			"informazione": "in-for-ma-zio-ne",
			"governo": "go-ver-no",
			"sviluppo": "svi-lup-po",
			"educazione": "e-du-ca-zio-ne",
			"opportunità": "op-por-tu-ni-tà",
			"responsabilità": "re-spon-sa-bi-li-tà",
			"straordinario": "stra-or-di-na-rio",
			"particolarmente": "par-ti-co-lar-men-te",
			"specialmente": "spe-cial-men-te",
			"principalmente": "prin-ci-pal-men-te",
			"generalmente": "ge-ne-ral-men-te",
			"necessariamente": "ne-ces-sa-ria-men-te",
			"probabilmente": "pro-ba-bil-men-te",
			"possibilmente": "pos-si-bil-men-te",
			"definitivamente": "de-fi-ni-ti-va-men-te",
			"effettivamente": "ef-fet-ti-va-men-te",
			"esattamente": "e-sat-ta-men-te",
			"semplicemente": "sem-pli-ce-men-te",
			"unicamente": "u-ni-ca-men-te",
			"soltanto": "sol-tan-to",
			"realmente": "re-al-men-te",
			"veramente": "ve-ra-men-te",
			"assolutamente": "as-so-lu-ta-men-te",
			"completamente": "com-ple-ta-men-te",
			"totalmente": "to-tal-men-te",
			"chiaramente": "chia-ra-men-te",
			"evidentemente": "e-vi-den-te-men-te",
			"ovviamente": "ov-via-men-te",
			"naturalmente": "na-tu-ral-men-te",
			"logicamente": "lo-gi-ca-men-te",
			"rapidamente": "ra-pi-da-men-te",
			"lentamente": "len-ta-men-te",
			"facilmente": "fa-cil-men-te",
			"difficilmente": "dif-fi-cil-men-te",
			"correttamente": "cor-ret-ta-men-te",
			"perfettamente": "per-fet-ta-men-te",
			"precisamente": "pre-ci-sa-men-te",
			"specificamente": "spe-ci-fi-ca-men-te",
			"fondamentalmente": "fon-da-men-tal-men-te",
			"essenzialmente": "es-sen-zial-men-te",
			"attualmente": "at-tu-al-men-te",
			"ugualmente": "u-gual-men-te",
			"eventualmente": "e-ven-tu-al-men-te",
			"rispettivamente": "ris-pet-ti-va-men-te",
			"relativamente": "re-la-ti-va-men-te",
			"notevolmente": "no-te-vol-men-te",
			"ambiente": "am-bien-te",
			"comprensione": "com-pren-sio-ne",
			"riconoscimento": "ri-co-no-sci-men-to",
			"istituzione": "is-ti-tu-zio-ne",
			"rappresentazione": "rap-pre-sen-ta-zio-ne",
			"amministrazione": "am-mi-ni-stra-zio-ne",
			"organizzazione": "or-ga-niz-za-zio-ne",
			"miglioramento": "mi-glio-ra-men-to",
			"trasformazione": "tras-for-ma-zio-ne",
			"partecipazione": "par-te-ci-pa-zio-ne",
			"collaborazione": "col-la-bo-ra-zio-ne",
			"documentazione": "do-cu-men-ta-zio-ne",
			"spiegazione": "spie-ga-zio-ne",
			"preparazione": "pre-pa-ra-zio-ne",
			"presentazione": "pre-sen-ta-zio-ne",
			"produzione": "pro-du-zio-ne",
			"protezione": "pro-te-zio-ne",
			"realizzazione": "re-a-liz-za-zio-ne",
			"riduzione": "ri-du-zio-ne",
			"riflessione": "ri-fles-sio-ne",
			"regolazione": "re-go-la-zio-ne",
			"relazione": "re-la-zio-ne",
			"rivoluzione": "ri-vo-lu-zio-ne",
			"soddisfazione": "sod-dis-fa-zio-ne",
			"situazione": "si-tu-a-zio-ne",
			"traduzione": "tra-du-zio-ne"
		}
	},
	pt: {
		patterns: "a2cao3 a3mente an4mente en4mente is4mente ica4mente ico4mente vel4men4 vel3men4 al4men4 el4men4 il4men4 ol4men4 ul4men4",
		exceptions: {
			"consideração": "con-si-de-ra-ção",
			"internacional": "in-ter-na-cio-nal",
			"comunicação": "co-mu-ni-ca-ção",
			"informação": "in-for-ma-ção",
			"governo": "go-ver-no",
			"desenvolvimento": "de-sen-vol-vi-men-to",
			"educação": "e-du-ca-ção",
			"oportunidade": "o-por-tu-ni-da-de",
			"responsabilidade": "res-pon-sa-bi-li-da-de",
			"extraordinário": "ex-tra-or-di-ná-rio",
			"particularmente": "par-ti-cu-lar-men-te",
			"especialmente": "es-pe-cial-men-te",
			"principalmente": "prin-ci-pal-men-te",
			"geralmente": "ge-ral-men-te",
			"necessariamente": "ne-ces-sa-ria-men-te",
			"provavelmente": "pro-va-vel-men-te",
			"possivelmente": "pos-si-vel-men-te",
			"definitivamente": "de-fi-ni-ti-va-men-te",
			"efetivamente": "e-fe-ti-va-men-te",
			"exatamente": "ex-a-ta-men-te",
			"simplesmente": "sim-ples-men-te",
			"unicamente": "u-ni-ca-men-te",
			"somente": "so-men-te",
			"realmente": "re-al-men-te",
			"verdadeiramente": "ver-da-dei-ra-men-te",
			"absolutamente": "ab-so-lu-ta-men-te",
			"completamente": "com-ple-ta-men-te",
			"totalmente": "to-tal-men-te",
			"claramente": "cla-ra-men-te",
			"evidentemente": "e-vi-den-te-men-te",
			"obviamente": "ob-via-men-te",
			"naturalmente": "na-tu-ral-men-te",
			"logicamente": "lo-gi-ca-men-te",
			"rapidamente": "rá-pi-da-men-te",
			"lentamente": "len-ta-men-te",
			"facilmente": "fa-cil-men-te",
			"dificilmente": "di-fi-cil-men-te",
			"corretamente": "cor-re-ta-men-te",
			"perfeitamente": "per-fei-ta-men-te",
			"precisamente": "pre-ci-sa-men-te",
			"especificamente": "es-pe-ci-fi-ca-men-te",
			"fundamentalmente": "fun-da-men-tal-men-te",
			"essencialmente": "es-sen-cial-men-te",
			"atualmente": "a-tu-al-men-te",
			"igualmente": "i-gual-men-te",
			"eventualmente": "e-ven-tu-al-men-te",
			"respectivamente": "res-pec-ti-va-men-te",
			"relativamente": "re-la-ti-va-men-te",
			"consideravelmente": "con-si-de-ra-vel-men-te",
			"compreensão": "com-pre-en-são",
			"reconhecimento": "re-co-nhe-ci-men-to",
			"estabelecimento": "es-ta-be-le-ci-men-to",
			"representação": "re-pre-sen-ta-ção",
			"administração": "ad-mi-nis-tra-ção",
			"organização": "or-ga-ni-za-ção",
			"melhoria": "me-lho-ria",
			"transformação": "trans-for-ma-ção",
			"participação": "par-ti-ci-pa-ção",
			"colaboração": "co-la-bo-ra-ção",
			"documentação": "do-cu-men-ta-ção",
			"explicação": "ex-pli-ca-ção",
			"preparação": "pre-pa-ra-ção",
			"apresentação": "a-pre-sen-ta-ção",
			"produção": "pro-du-ção",
			"proteção": "pro-te-ção",
			"realização": "re-a-li-za-ção",
			"redução": "re-du-ção",
			"reflexão": "re-fle-xão",
			"regulação": "re-gu-la-ção",
			"relação": "re-la-ção",
			"revolução": "re-vo-lu-ção",
			"satisfação": "sa-tis-fa-ção",
			"situação": "si-tu-a-ção",
			"tradução": "tra-du-ção"
		}
	}
};

class Hyphenator {
	private _cache: Map<string, number[]>;
	private _compiledPatterns: Map<string, Record<string, PatternPosition[][]>>;

	constructor() {
		this._cache = new Map();
		this._compiledPatterns = new Map();
		this._compileAllPatterns();
	}

	private _compileAllPatterns(): void {
		for (const [lang, data] of Object.entries(HYPHENATION_PATTERNS)) {
			this._compiledPatterns.set(lang, this._parsePatterns(data.patterns));
		}
	}

	private _parsePatterns(patternString: string): Record<string, PatternPosition[][]> {
		const patterns: Record<string, PatternPosition[][]> = {};
		const patternList = patternString.split(/\s+/);

		for (const pattern of patternList) {
			const levels = pattern.replace(/\d/g, "");
			const positions: PatternPosition[] = [];
			let pos = 0;
			for (const char of pattern) {
				if (/\d/.test(char)) {
					positions.push({ index: pos, level: parseInt(char, 10) });
				}
				pos++;
			}
			if (!patterns[levels]) {
				patterns[levels] = [];
			}
			patterns[levels].push(positions);
		}

		return patterns;
	}

	hyphenate(word: string, lang: string = "en", options: HyphenateOptions = {}): string {
		const {
			hyphenCharacter = "\u00AD",
			minWordLength = 5,
			minCharsBefore = 2,
			minCharsAfter = 2,
		} = options;

		if (!word || word.length < minWordLength) {
			return word;
		}

		const lowerWord = word.toLowerCase();
		const cacheKey = `${lowerWord}_${lang}_${hyphenCharacter}_${minWordLength}_${minCharsBefore}_${minCharsAfter}`;

		if (this._cache.has(cacheKey)) {
			const cached = this._cache.get(cacheKey)!;
			return this._applyHyphenation(word, cached, hyphenCharacter);
		}

		let breakPoints: number[];

		if (HYPHENATION_PATTERNS[lang] && HYPHENATION_PATTERNS[lang].exceptions[lowerWord]) {
			const exception = HYPHENATION_PATTERNS[lang].exceptions[lowerWord];
			breakPoints = this._getBreakPointsFromException(exception, word);
		} else if (typeof Intl !== "undefined" && Intl.Segmenter) {
			breakPoints = this._tryIntlSegmenter(word, lang);
		} else if (HYPHENATION_PATTERNS[lang]) {
			breakPoints = this._applyKnuthLiang(word, lang);
		} else {
			breakPoints = [];
		}

		breakPoints = this._applyConstraints(breakPoints, word.length, minCharsBefore, minCharsAfter);

		this._cache.set(cacheKey, breakPoints);

		return this._applyHyphenation(word, breakPoints, hyphenCharacter);
	}

	private _getBreakPointsFromException(exception: string, originalWord: string): number[] {
		const parts = exception.split("-");
		const breakPoints: number[] = [];
		let pos = 0;

		for (let i = 0; i < parts.length - 1; i++) {
			pos += parts[i].length;
			if (pos < originalWord.length) {
				breakPoints.push(pos);
			}
		}

		return breakPoints;
	}

	private _tryIntlSegmenter(word: string, lang: string): number[] {
		try {
			const segmenter = new Intl.Segmenter(lang, { granularity: "word" });
			const segments = [...segmenter.segment(word)];
			const breakPoints: number[] = [];
			let pos = 0;

			for (const segment of segments) {
				if (segment.isWordLike && segment.segment.length > 4) {
					const vowelPositions = this._findVowelPositions(segment.segment);

					if (vowelPositions.length > 0) {
						const bestSplit = this._findBestSyllableBreak(segment.segment, vowelPositions);
						if (bestSplit > 0 && bestSplit < segment.segment.length) {
							breakPoints.push(pos + bestSplit);
						}
					}
				}
				pos += segment.segment.length;
			}

			return breakPoints;
		} catch (e) {
			return [];
		}
	}

	private _findVowelPositions(word: string): number[] {
		const vowels = "aeiouáéíóúàèìòùäëïöüâêîôûãõåæø";
		const positions: number[] = [];

		for (let i = 0; i < word.length; i++) {
			if (vowels.includes(word[i])) {
				positions.push(i);
			}
		}

		return positions;
	}

	private _findBestSyllableBreak(word: string, vowelPositions: number[]): number {
		if (vowelPositions.length === 0) return 0;

		for (let i = 0; i < vowelPositions.length - 1; i++) {
			const vowelPos = vowelPositions[i];
			const nextVowelPos = vowelPositions[i + 1];
			const between = nextVowelPos - vowelPos - 1;

			if (between === 0) {
				continue;
			} else if (between === 1) {
				const midPos = vowelPos + 1;
				if (midPos >= 2 && midPos <= word.length - 2) {
					return midPos;
				}
			} else if (between === 2) {
				const midPos = vowelPos + 1;
				const consonantPair = word.substring(midPos, midPos + 2);
				if (this._isValidConsonantPair(consonantPair)) {
					if (midPos >= 2 && midPos + 1 <= word.length - 2) {
						return midPos + 1;
					}
				} else {
					if (midPos >= 2 && midPos <= word.length - 2) {
						return midPos;
					}
				}
			} else {
				const midPos = vowelPos + Math.floor(between / 2);
				if (midPos >= 2 && midPos <= word.length - 2) {
					return midPos;
				}
			}
		}

		return 0;
	}

	private _isValidConsonantPair(pair: string): boolean {
		const validPairs = ["bl", "br", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "pl", "pr", "sk", "sl", "sm", "sn", "sp", "st", "sw", "tr", "tw", "ch", "sh", "th", "ph", "wh", "wr", "sc", "str", "spr", "spl"];
		return validPairs.includes(pair.toLowerCase());
	}

	private _applyKnuthLiang(word: string, lang: string): number[] {
		const compiled = this._compiledPatterns.get(lang);
		if (!compiled) return [];

		const paddedWord = "." + word.toLowerCase() + ".";
		const levels = new Array(paddedWord.length + 1).fill(0) as number[];

		for (let i = 0; i < paddedWord.length; i++) {
			for (let len = 1; len <= paddedWord.length - i && len <= 10; len++) {
				const subword = paddedWord.substring(i, i + len);

				if (compiled[subword]) {
					for (const positions of compiled[subword]) {
						for (const { index, level } of positions) {
							const pos = i + index;
							if (pos < levels.length && level > levels[pos]) {
								levels[pos] = level;
							}
						}
					}
				}
			}
		}

		const breakPoints: number[] = [];
		for (let i = 2; i < levels.length - 2; i++) {
			if (levels[i] % 2 === 1) {
				breakPoints.push(i - 1);
			}
		}

		return breakPoints;
	}

	private _applyConstraints(breakPoints: number[], wordLength: number, minBefore: number, minAfter: number): number[] {
		return breakPoints.filter(pos => pos >= minBefore && pos <= wordLength - minAfter);
	}

	private _applyHyphenation(word: string, breakPoints: number[], hyphenCharacter: string): string {
		if (breakPoints.length === 0) return word;

		let result = "";
		let lastPos = 0;

		for (const pos of breakPoints) {
			result += word.substring(lastPos, pos) + hyphenCharacter;
			lastPos = pos;
		}

		result += word.substring(lastPos);

		return result;
	}

	findHyphenationPoints(word: string, lang: string = "en", options: HyphenateOptions = {}): number[] {
		const {
			minWordLength = 5,
			minCharsBefore = 2,
			minCharsAfter = 2,
		} = options;

		if (!word || word.length < minWordLength) {
			return [];
		}

		const lowerWord = word.toLowerCase();
		let breakPoints: number[];

		if (HYPHENATION_PATTERNS[lang] && HYPHENATION_PATTERNS[lang].exceptions[lowerWord]) {
			const exception = HYPHENATION_PATTERNS[lang].exceptions[lowerWord];
			breakPoints = this._getBreakPointsFromException(exception, word);
		} else if (HYPHENATION_PATTERNS[lang]) {
			breakPoints = this._applyKnuthLiang(word, lang);
		} else {
			breakPoints = [];
		}

		return this._applyConstraints(breakPoints, word.length, minCharsBefore, minCharsAfter);
	}

	getSupportedLanguages(): string[] {
		return Object.keys(HYPHENATION_PATTERNS);
	}

	clearCache(): void {
		this._cache.clear();
	}
}

const hyphenator = new Hyphenator();

export default hyphenator;
export { Hyphenator, HYPHENATION_PATTERNS, HyphenateOptions };
