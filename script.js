const SUBMISSION_ENDPOINT = "/api/applications";
const ORGANIZATION_NAME = "Model UN Academy Luanda Chapter";
const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
const LUANDA_REQUIREMENT_TEXT = "Esta função exige disponibilidade presencial em Luanda. Candidatos que não estejam em Luanda ou que não tenham disponibilidade para atuar presencialmente em Luanda não são elegíveis para esta posição.";
const LUANDA_INELIGIBLE_TEXT = "Obrigado pelo seu interesse. No entanto, esta posição exige atuação presencial em Luanda, portanto você não é elegível para este cargo.";
const routingCache = {};

const jobs = {
    escolas: {
        title: "Coordenador de Relações com Escolas",
        icon: "fa-school",
        short: "Apoia a aproximação da organização às escolas e comunidades estudantis.",
        description: "Responsável por criar contacto com escolas, apresentar oportunidades da Model UN Academy e acompanhar potenciais parcerias educativas.",
        essential: [
            "Boa comunicação oral e escrita.",
            "Responsabilidade no cumprimento de prazos.",
            "Capacidade de organizar contactos e informações.",
            "Disponibilidade para interagir com instituições de ensino."
        ],
        valued: [
            "Experiência em clubes escolares ou associações estudantis.",
            "Facilidade para apresentações e reuniões.",
            "Interesse por educação, liderança juvenil e relações internacionais."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer o percurso académico, atividades e experiências relevantes do candidato.",
                required: true
            }
        ]
    },
    universidades: {
        title: "Coordenador de Relações com Universidades",
        icon: "fa-building-columns",
        short: "Constrói pontes com universidades e grupos académicos.",
        description: "Acompanha contactos universitários, identifica oportunidades de colaboração e apoia iniciativas direcionadas a estudantes do ensino superior.",
        essential: [
            "Boa escrita e comunicação institucional.",
            "Organização e acompanhamento de contactos.",
            "Responsabilidade e postura profissional.",
            "Interesse por ambiente académico e juventude."
        ],
        valued: [
            "Participação em núcleos estudantis.",
            "Conhecimento de universidades ou associações universitárias.",
            "Capacidade de planear reuniões e apresentações."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Permite analisar o percurso académico, envolvimento estudantil e experiências relevantes.",
                required: true
            }
        ]
    },
    parcerias: {
        title: "Parcerias Institucionais",
        icon: "fa-handshake",
        short: "Apoia a criação de parcerias com organizações, empresas e instituições.",
        description: "Trabalha na identificação, abordagem e acompanhamento de parceiros que possam contribuir para o crescimento da organização.",
        essential: [
            "Comunicação profissional e respeitosa.",
            "Capacidade de pesquisa e organização.",
            "Responsabilidade no seguimento de contactos.",
            "Boa apresentação escrita."
        ],
        valued: [
            "Interesse por negociação e relações institucionais.",
            "Experiência em projetos juvenis.",
            "Facilidade para preparar propostas simples."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a avaliar experiências, atividades e competências de contacto institucional.",
                required: true
            }
        ]
    },
    diaspora: {
        title: "Coordenador da Diáspora",
        icon: "fa-earth-africa",
        short: "Liga a organização a jovens angolanos e parceiros fora do país.",
        description: "Apoia contactos com a diáspora angolana, oportunidades internacionais e iniciativas que aproximem jovens em diferentes contextos.",
        essential: [
            "Boa comunicação escrita.",
            "Interesse por relações internacionais e diáspora.",
            "Organização de contactos e informações.",
            "Responsabilidade e discrição."
        ],
        valued: [
            "Conhecimentos de inglês ou outra língua estrangeira.",
            "Rede de contactos em comunidades estudantis internacionais.",
            "Experiência em comunicação online."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Permite conhecer experiências académicas, linguísticas e associativas relevantes.",
                required: true
            }
        ]
    },
    provincial: {
        title: "Coordenador Provincial",
        icon: "fa-location-dot",
        short: "Apoia a expansão e organização de iniciativas em diferentes províncias.",
        description: "Contribui para mapear oportunidades locais, contactar estudantes e apoiar a coordenação de atividades fora do centro de Luanda.",
        essential: [
            "Responsabilidade e capacidade de organização.",
            "Boa comunicação com equipas e instituições.",
            "Conhecimento básico da realidade local.",
            "Disponibilidade para acompanhamento regular."
        ],
        valued: [
            "Experiência em liderança estudantil.",
            "Contacto com escolas, universidades ou grupos juvenis.",
            "Capacidade de mobilizar equipas."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a analisar percurso, atividades locais e experiências de liderança ou organização.",
                required: true
            }
        ]
    },
    designer: {
        title: "Designer Gráfico",
        icon: "fa-palette",
        requiresLuanda: true,
        short: "Cria materiais visuais alinhados à identidade institucional.",
        description: "Apoia a produção de cartazes, publicações digitais, apresentações e peças gráficas para comunicação da organização.",
        essential: [
            "Noções de composição visual e atenção ao detalhe.",
            "Capacidade básica de trabalhar com Canva, Photoshop, Illustrator ou ferramenta semelhante.",
            "Responsabilidade com prazos e identidade visual.",
            "Vontade de aprender e receber feedback."
        ],
        valued: [
            "Portfólio com peças gráficas.",
            "Experiência em redes sociais ou comunicação visual.",
            "Interesse por design institucional e educativo."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer o percurso e experiências do candidato.",
                required: true
            },
            {
                id: "portfolio",
                name: "Portfólio",
                reason: "Permite ver exemplos de trabalhos visuais, mesmo que sejam projetos pessoais ou escolares.",
                required: true
            }
        ]
    },
    redator: {
        title: "Redator de Conteúdo",
        icon: "fa-pen-nib",
        requiresLuanda: true,
        short: "Produz textos claros para comunicação institucional e educativa.",
        description: "Apoia a escrita de publicações, artigos curtos, legendas, comunicados e conteúdos informativos da organização.",
        essential: [
            "Boa escrita em português.",
            "Clareza, organização de ideias e atenção à revisão.",
            "Responsabilidade com prazos.",
            "Interesse por temas juvenis, educação e relações internacionais."
        ],
        valued: [
            "Exemplos de textos, artigos ou publicações.",
            "Conhecimentos básicos de inglês.",
            "Criatividade e capacidade de adaptar linguagem ao público."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer o percurso académico e experiências relevantes.",
                required: true
            },
            {
                id: "writing",
                name: "Texto de autoria",
                reason: "Permite avaliar clareza, organização e estilo de escrita. Pode ser um texto escolar, artigo ou publicação.",
                required: true
            }
        ]
    },
    fotografo: {
        title: "Fotógrafo",
        icon: "fa-camera",
        requiresLuanda: true,
        short: "Regista eventos, atividades e momentos institucionais.",
        description: "Apoia a captação de fotografias para eventos, redes sociais e memória institucional da organização.",
        essential: [
            "Noções básicas de enquadramento e composição.",
            "Responsabilidade no tratamento de imagens.",
            "Disponibilidade para eventos ou atividades combinadas.",
            "Capacidade de usar câmara ou smartphone com boa qualidade."
        ],
        valued: [
            "Portfólio com fotografias.",
            "Conhecimentos básicos de edição.",
            "Experiência em cobertura de eventos escolares ou juvenis."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer experiências e disponibilidade do candidato.",
                required: true
            },
            {
                id: "portfolio",
                name: "Portfólio",
                reason: "Permite ver exemplos de fotografias já feitas, mesmo em contexto pessoal ou estudantil.",
                required: true
            }
        ]
    },
    videografo: {
        title: "Videógrafo",
        icon: "fa-video",
        requiresLuanda: true,
        short: "Produz e apoia conteúdos audiovisuais da organização.",
        description: "Apoia a gravação e edição de vídeos para eventos, redes sociais e campanhas institucionais.",
        essential: [
            "Noções básicas de gravação e enquadramento.",
            "Capacidade básica de editar em CapCut, InShot ou ferramenta semelhante.",
            "Responsabilidade com prazos.",
            "Atenção ao som, imagem e organização dos ficheiros."
        ],
        valued: [
            "Exemplos de vídeos editados.",
            "Criatividade para conteúdos curtos.",
            "Experiência em eventos ou redes sociais."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer experiências e disponibilidade do candidato.",
                required: true
            },
            {
                id: "portfolio",
                name: "Portfólio",
                reason: "Permite avaliar exemplos de vídeos, edições ou projetos audiovisuais.",
                required: true
            }
        ]
    },
    rp: {
        title: "Relações Públicas",
        icon: "fa-users",
        short: "Representa a organização e apoia a comunicação com públicos externos.",
        description: "Apoia contactos externos, receção de convidados, comunicação institucional e representação em atividades oficiais.",
        essential: [
            "Boa comunicação e postura profissional.",
            "Responsabilidade e pontualidade.",
            "Capacidade de lidar com diferentes públicos.",
            "Clareza na comunicação escrita e oral."
        ],
        valued: [
            "Conhecimentos de inglês.",
            "Experiência em eventos, clubes ou representação estudantil.",
            "Facilidade para trabalhar em equipa."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a analisar experiências, atividades e competências de comunicação.",
                required: true
            },
            {
                id: "english",
                name: "Certificado de Inglês ou comprovativo equivalente",
                reason: "Opcionalmente comprova conhecimentos linguísticos valorizados para representação e contacto externo.",
                required: false
            }
        ]
    },
    especialistaCurriculo: {
        title: "Especialista de Currículo",
        icon: "fa-book-open-reader",
        short: "Apoia a estruturação de conteúdos, módulos e percursos formativos.",
        description: "Contribui para organizar conteúdos educativos, objetivos de aprendizagem e materiais ligados à formação dos participantes.",
        essential: [
            "Interesse por educação, currículo e aprendizagem.",
            "Boa escrita e capacidade de organizar ideias.",
            "Atenção ao detalhe na revisão de conteúdos.",
            "Responsabilidade com prazos e orientação da equipa."
        ],
        valued: [
            "Experiência em clubes académicos, explicações ou projetos educativos.",
            "Conhecimento básico de ferramentas de documentos digitais.",
            "Capacidade de transformar temas complexos em conteúdo claro."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Permite avaliar formação, experiências académicas e envolvimento em atividades educativas.",
                required: true
            }
        ]
    },
    coordenadorPedagogico: {
        title: "Coordenador Pedagógico",
        icon: "fa-chalkboard-user",
        short: "Acompanha a organização pedagógica das formações e atividades educativas.",
        description: "Apoia a coordenação de sessões, acompanhamento de participantes e alinhamento entre objetivos pedagógicos e execução das atividades.",
        essential: [
            "Boa comunicação com participantes e equipa.",
            "Capacidade de planear e acompanhar atividades.",
            "Responsabilidade e atenção ao processo de aprendizagem.",
            "Interesse por educação e desenvolvimento estudantil."
        ],
        valued: [
            "Experiência em liderança, tutoria ou apoio académico.",
            "Facilidade para mediar grupos e acompanhar progresso.",
            "Organização de calendários, sessões ou materiais."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer experiências de coordenação, formação, liderança ou apoio estudantil.",
                required: true
            }
        ]
    },
    tecnicoAvaliacaoMonitoria: {
        title: "Técnico de Avaliação e Monitoria",
        icon: "fa-chart-line",
        short: "Apoia o acompanhamento de resultados, dados e indicadores das atividades.",
        description: "Contribui para recolher informações, organizar dados simples e apoiar a avaliação do impacto das iniciativas formativas.",
        essential: [
            "Organização e atenção ao detalhe.",
            "Capacidade de trabalhar com dados e registos simples.",
            "Responsabilidade na recolha e tratamento de informações.",
            "Boa comunicação escrita para relatórios básicos."
        ],
        valued: [
            "Noções de Excel, Google Sheets ou ferramentas semelhantes.",
            "Interesse por avaliação, monitoria e melhoria de projetos.",
            "Experiência em pesquisas, formulários ou relatórios escolares."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer formação, experiências com dados, relatórios ou projetos académicos.",
                required: true
            }
        ]
    },
    tecnicoMateriaisDidaticos: {
        title: "Técnico de Materiais Didáticos",
        icon: "fa-layer-group",
        short: "Apoia a criação, organização e revisão de materiais educativos.",
        description: "Trabalha na preparação de guias, fichas, apresentações e outros materiais de apoio às formações.",
        essential: [
            "Boa escrita e organização visual básica.",
            "Atenção ao detalhe na revisão de materiais.",
            "Capacidade de trabalhar com documentos digitais.",
            "Responsabilidade com prazos e orientações recebidas."
        ],
        valued: [
            "Experiência com Word, Google Docs, PowerPoint, Canva ou ferramentas semelhantes.",
            "Interesse por design educativo e comunicação clara.",
            "Capacidade de adaptar conteúdos para estudantes."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Permite conhecer formação, experiências académicas e competências com materiais digitais.",
                required: true
            }
        ]
    },
    assistenteAdministrativo: {
        title: "Assistente Administrativo",
        icon: "fa-folder-open",
        short: "Apoia tarefas administrativas, organização de documentos e acompanhamento interno.",
        description: "Contribui para manter registos, organizar informações, apoiar agendas e dar suporte administrativo à equipa.",
        essential: [
            "Organização de documentos e informações.",
            "Boa comunicação escrita.",
            "Responsabilidade e discrição.",
            "Capacidade básica de usar documentos digitais."
        ],
        valued: [
            "Experiência em secretariado estudantil, clubes ou grupos académicos.",
            "Noções de Word, Google Docs, Excel ou ferramentas semelhantes.",
            "Atenção a prazos, reuniões e registos."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer experiências de organização, apoio administrativo ou participação em projetos.",
                required: true
            }
        ]
    },
    eventos: {
        title: "Assistente de Organização de Eventos",
        icon: "fa-calendar-check",
        requiresLuanda: true,
        short: "Apoia a preparação física e operacional dos eventos.",
        description: "Trabalha diretamente na montagem, preparação, apoio durante eventos e execução das tarefas necessárias para que cada atividade esteja pronta.",
        essential: [
            "Organização operacional e atenção ao detalhe.",
            "Disponibilidade para apoiar preparação física, montagem e realização de eventos.",
            "Capacidade de seguir orientações e trabalhar em equipa.",
            "Responsabilidade na execução de tarefas antes, durante e depois das atividades."
        ],
        valued: [
            "Experiência em organização de eventos escolares, juvenis ou comunitários.",
            "Facilidade para resolver problemas práticos no local.",
            "Boa comunicação com equipa de apoio e responsáveis."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer experiências de organização, apoio operacional, trabalho em equipa e disponibilidade para eventos.",
                required: true
            }
        ]
    },
    secretario: {
        title: "Secretário",
        icon: "fa-clipboard-list",
        short: "Organiza documentos, reuniões e informações internas.",
        description: "Apoia o funcionamento administrativo da equipa, mantendo registos claros e ajudando na organização das atividades.",
        essential: [
            "Organização de documentos e informações.",
            "Registo de reuniões e decisões.",
            "Organização de agendas e reuniões.",
            "Boa comunicação escrita.",
            "Responsabilidade e atenção aos detalhes.",
            "Capacidade básica de trabalhar com documentos digitais.",
            "Cumprimento de prazos.",
            "Discrição no tratamento de informações internas.",
            "Espírito de equipa.",
            "Vontade de aprender."
        ],
        valued: [
            "Experiência em clubes escolares, associações ou grupos de estudantes.",
            "Noções de Google Docs, Word, Excel ou ferramentas semelhantes.",
            "Gosto por organização e apoio administrativo."
        ],
        documents: [
            {
                id: "cv",
                name: "Curriculum Vitae",
                reason: "Ajuda a conhecer o percurso, atividades e responsabilidades já assumidas pelo candidato.",
                required: true
            }
        ]
    }
};

const commonQuestions = [
    {
        id: "motivation",
        label: "Por que gostaria de fazer parte da Model UN Academy Luanda Chapter?",
        type: "textarea",
        maxLength: 700,
        placeholder: "Explique a sua motivação em poucas linhas."
    },
    {
        id: "fit",
        label: "Por que acha que é a pessoa certa para este cargo?",
        type: "textarea",
        maxLength: 700,
        placeholder: "Relacione as suas competências com a função escolhida."
    },
    {
        id: "availability",
        label: "Consegue participar regularmente das reuniões?",
        type: "select",
        options: ["Sim", "Não", "Depende do horário"]
    }
];

const questionsByJob = {
    escolas: [
        { id: "schoolApproach", label: "Como abordaria um diretor de escola para apresentar a Model UN Academy e conseguir estabelecer uma parceria?", type: "textarea", maxLength: 700, placeholder: "Descreva uma abordagem institucional clara e respeitosa." },
        { id: "institutionalCommunication", label: "Como garantiria uma comunicação institucional clara e profissional com escolas?", type: "textarea", maxLength: 600, placeholder: "Explique como organizaria contactos, mensagens e seguimento." },
        { id: "schoolPartnershipFollowUp", label: "Como acompanharia uma escola depois do primeiro contacto para manter a parceria ativa?", type: "textarea", maxLength: 600, placeholder: "Indique passos de acompanhamento e organização." },
        { id: "previousExperience", label: "Que experiência anterior tem em contacto com escolas, clubes estudantis, associações ou projetos educativos?", type: "textarea", maxLength: 600, placeholder: "Inclua exemplos concretos, se existirem." }
    ],
    universidades: [
        { id: "universityApproach", label: "Como abordaria uma universidade para apresentar a Model UN Academy e estabelecer uma parceria?", type: "textarea", maxLength: 700, placeholder: "Descreva a abordagem e o seguimento institucional." },
        { id: "universityRelations", label: "Que experiência ou contacto tem com universidades, associações académicas ou grupos estudantis?", type: "textarea", maxLength: 600, placeholder: "Inclua experiências formais ou informais." },
        { id: "partnershipBuilding", label: "Como ajudaria a construir uma parceria útil para estudantes universitários?", type: "textarea", maxLength: 600, placeholder: "Explique a proposta de valor e a organização." },
        { id: "institutionalFollowUp", label: "Como acompanharia contactos institucionais para garantir continuidade e resposta?", type: "textarea", maxLength: 600, placeholder: "Indique método, registos e prazos." }
    ],
    parcerias: [
        { id: "partnerIdentification", label: "Como identificaria potenciais parceiros para a Model UN Academy?", type: "textarea", maxLength: 600, placeholder: "Explique critérios, pesquisa e prioridades." },
        { id: "institutionalApproach", label: "Como faria uma abordagem institucional a um potencial parceiro?", type: "textarea", maxLength: 700, placeholder: "Descreva mensagem, postura e seguimento." },
        { id: "proposalBuilding", label: "Como ajudaria a construir uma proposta de parceria clara e convincente?", type: "textarea", maxLength: 600, placeholder: "Indique elementos que incluiria numa proposta." },
        { id: "relationshipMaintenance", label: "Como manteria uma relação profissional com parceiros depois da parceria iniciada?", type: "textarea", maxLength: 600, placeholder: "Explique acompanhamento, comunicação e responsabilidade." }
    ],
    diaspora: [
        { id: "diasporaCommunication", label: "Como comunicaria com jovens angolanos ou comunidades angolanas no exterior?", type: "textarea", maxLength: 650, placeholder: "Explique canais, tom e organização." },
        { id: "networkBuilding", label: "Como construiria uma rede de contactos na diáspora para apoiar oportunidades internacionais?", type: "textarea", maxLength: 650, placeholder: "Descreva estratégia e acompanhamento." },
        { id: "representationExperience", label: "Que experiência tem com comunidades, organizações, grupos estudantis ou representação institucional?", type: "textarea", maxLength: 600, placeholder: "Inclua exemplos, se existirem." },
        { id: "internationalOpportunityChallenge", label: "Qual considera ser o maior desafio para conectar jovens angolanos a oportunidades internacionais?", type: "textarea", maxLength: 600, placeholder: "Partilhe a sua análise e possíveis respostas." }
    ],
    provincial: [
        { id: "territorialCoordination", label: "Como organizaria e acompanharia atividades em diferentes províncias?", type: "textarea", maxLength: 650, placeholder: "Explique coordenação, comunicação e seguimento." },
        { id: "teamLeadership", label: "Que experiência tem em liderança ou coordenação de pessoas?", type: "textarea", maxLength: 600, placeholder: "Inclua exemplos concretos." },
        { id: "localProblemSolving", label: "Como resolveria dificuldades de comunicação, distância ou organização entre equipas locais?", type: "textarea", maxLength: 650, placeholder: "Descreva uma abordagem prática." },
        { id: "activityFollowUp", label: "Como garantiria acompanhamento regular das atividades e resultados na sua área?", type: "textarea", maxLength: 600, placeholder: "Indique método de registo e prestação de contas." }
    ],
    designer: [
        { id: "designExperience", label: "Que experiência tem em design gráfico e criação de peças visuais?", type: "textarea", maxLength: 600, placeholder: "Inclua projetos pessoais, escolares ou profissionais." },
        { id: "designTools", label: "Que ferramentas ou softwares de design domina?", type: "textarea", maxLength: 500, placeholder: "Ex.: Canva, Photoshop, Illustrator, Figma." },
        { id: "visualIdentity", label: "Como garantiria que as peças respeitam a identidade visual da organização?", type: "textarea", maxLength: 600, placeholder: "Explique o seu cuidado com consistência visual." },
        { id: "socialMediaDesign", label: "Que experiência tem na criação de peças para redes sociais ou materiais institucionais?", type: "textarea", maxLength: 600, placeholder: "Descreva formatos e exemplos." },
        { id: "portfolioExamples", label: "Indique links ou descreva exemplos do seu portfólio mais relevantes para esta função.", type: "textarea", maxLength: 600, placeholder: "Pode indicar links ou descrever trabalhos anexados." }
    ],
    redator: [
        { id: "writingExperience", label: "Que experiência tem em redação ou produção de conteúdo?", type: "textarea", maxLength: 600, placeholder: "Inclua textos escolares, artigos, publicações ou projetos." },
        { id: "contentTypes", label: "Que tipos de conteúdo sabe produzir com mais segurança?", type: "textarea", maxLength: 500, placeholder: "Ex.: legendas, artigos, comunicados, roteiros, posts." },
        { id: "audienceAdaptation", label: "Como adapta a linguagem para diferentes públicos?", type: "textarea", maxLength: 600, placeholder: "Dê um exemplo de adaptação de tom ou formato." },
        { id: "institutionalContent", label: "Que experiência tem com redes sociais ou conteúdo institucional?", type: "textarea", maxLength: 600, placeholder: "Descreva plataformas, formatos ou responsabilidades." },
        { id: "deadlineWriting", label: "Como organiza o seu trabalho para cumprir prazos de escrita e revisão?", type: "textarea", maxLength: 500, placeholder: "Explique método, revisão e entrega." },
        { id: "writingSamples", label: "Indique links ou descreva exemplos de textos que representem bem a sua escrita.", type: "textarea", maxLength: 600, placeholder: "Pode indicar links ou referir o texto anexado." }
    ],
    fotografo: [
        { id: "photoExperience", label: "Que experiência tem em fotografia?", type: "textarea", maxLength: 600, placeholder: "Inclua eventos, projetos pessoais ou trabalhos escolares." },
        { id: "photoEquipment", label: "Que equipamento fotográfico sabe utilizar?", type: "textarea", maxLength: 500, placeholder: "Pode incluir câmara, smartphone, luzes ou acessórios." },
        { id: "photoEditing", label: "Que experiência tem em edição ou tratamento de fotografias?", type: "textarea", maxLength: 500, placeholder: "Indique ferramentas e tipo de edição." },
        { id: "eventCoverage", label: "Como faria a cobertura fotográfica de um evento da organização?", type: "textarea", maxLength: 650, placeholder: "Explique preparação, captação e entrega." },
        { id: "composition", label: "Como trabalha composição, enquadramento e seleção das melhores imagens?", type: "textarea", maxLength: 600, placeholder: "Descreva o seu critério visual." },
        { id: "portfolioExamples", label: "Indique links ou descreva exemplos do seu portfólio mais relevantes para esta função.", type: "textarea", maxLength: 600, placeholder: "Pode indicar links ou descrever trabalhos anexados." }
    ],
    videografo: [
        { id: "videoExperience", label: "Que experiência tem em produção de vídeo?", type: "textarea", maxLength: 600, placeholder: "Inclua gravação, edição, eventos ou redes sociais." },
        { id: "videoTools", label: "Que ferramentas ou softwares de edição de vídeo domina?", type: "textarea", maxLength: 500, placeholder: "Ex.: CapCut, Premiere, DaVinci Resolve, InShot." },
        { id: "videoEquipment", label: "Que equipamentos sabe utilizar para gravação de vídeo?", type: "textarea", maxLength: 500, placeholder: "Pode incluir câmara, smartphone, microfone, tripé ou luz." },
        { id: "videoEventCoverage", label: "Como faria a cobertura audiovisual de um evento da organização?", type: "textarea", maxLength: 650, placeholder: "Explique preparação, gravação, som, imagem e entrega." },
        { id: "visualStorytelling", label: "Como contaria uma história através de vídeo curto para redes sociais?", type: "textarea", maxLength: 600, placeholder: "Explique narrativa, ritmo e escolha de imagens." },
        { id: "portfolioExamples", label: "Indique links ou descreva exemplos do seu portfólio mais relevantes para esta função.", type: "textarea", maxLength: 600, placeholder: "Pode indicar links ou descrever vídeos anexados." }
    ],
    rp: [
        { id: "publicRelationsExperience", label: "Que experiência tem em comunicação, relações públicas ou representação institucional?", type: "textarea", maxLength: 650, placeholder: "Inclua eventos, clubes, projetos ou atendimento ao público." },
        { id: "contactManagement", label: "Como organizaria e acompanharia contactos com pessoas e instituições?", type: "textarea", maxLength: 600, placeholder: "Explique registos, seguimento e postura profissional." },
        { id: "externalCommunication", label: "Como comunicaria externamente em nome da organização mantendo uma imagem profissional?", type: "textarea", maxLength: 650, placeholder: "Descreva tom, cuidado e responsabilidade." },
        { id: "delicateSituation", label: "Como lidaria com uma situação delicada envolvendo um convidado, parceiro ou participante?", type: "textarea", maxLength: 650, placeholder: "Explique como agiria com calma e respeito." },
        { id: "rpScenario", label: "Como apresentaria a Model UN Academy a uma instituição ou convidado que ainda não conhece a organização?", type: "textarea", maxLength: 650, placeholder: "Formule uma abordagem de relações públicas." }
    ],
    especialistaCurriculo: [
        { id: "academicBackground", label: "Qual é a sua formação académica e área de formação?", type: "textarea", maxLength: 600, placeholder: "Descreva curso, área, nível e interesses académicos." },
        { id: "technicalSkills", label: "Que competências técnicas tem para apoiar formação, currículo ou desenvolvimento de conteúdos?", type: "textarea", maxLength: 650, placeholder: "Inclua escrita, pesquisa, organização de módulos ou ferramentas." },
        { id: "educationCurriculumExperience", label: "Que experiência tem em educação, currículo, formação ou elaboração de conteúdos?", type: "textarea", maxLength: 700, placeholder: "Inclua projetos, explicações, clubes ou materiais." },
        { id: "contentDevelopment", label: "Como estruturaria um conteúdo ou sessão de formação para jovens participantes?", type: "textarea", maxLength: 700, placeholder: "Explique objetivos, sequência e avaliação." },
        { id: "academicProfessionalGoals", label: "Quais são os seus objetivos académicos ou profissionais e como se relacionam com esta função?", type: "textarea", maxLength: 600, placeholder: "Relacione o seu percurso com currículo e formação." }
    ],
    coordenadorPedagogico: [
        { id: "academicBackground", label: "Qual é a sua formação académica e área de formação?", type: "textarea", maxLength: 600, placeholder: "Descreva curso, área, nível e interesses académicos." },
        { id: "pedagogicalExperience", label: "Que experiência tem em pedagogia, tutoria, formação ou acompanhamento de estudantes?", type: "textarea", maxLength: 700, placeholder: "Inclua exemplos formais ou informais." },
        { id: "educationalPlanning", label: "Como planearia e acompanharia uma atividade educativa?", type: "textarea", maxLength: 700, placeholder: "Explique objetivos, organização, execução e avaliação." },
        { id: "studentFollowUp", label: "Como acompanharia estudantes ou equipas com diferentes níveis de preparação?", type: "textarea", maxLength: 650, placeholder: "Descreva orientação, comunicação e apoio." },
        { id: "pedagogicalProblemSolving", label: "Como resolveria um problema durante uma formação ou atividade pedagógica?", type: "textarea", maxLength: 650, placeholder: "Dê uma resposta prática e responsável." }
    ],
    tecnicoAvaliacaoMonitoria: [
        { id: "evaluationExperience", label: "Que experiência tem com avaliação, monitoria ou acompanhamento de resultados?", type: "textarea", maxLength: 650, placeholder: "Inclua projetos, pesquisas, formulários ou relatórios." },
        { id: "dataAnalysis", label: "Como faria a recolha e análise de dados de uma atividade da organização?", type: "textarea", maxLength: 700, placeholder: "Explique fontes, organização e tratamento dos dados." },
        { id: "indicators", label: "Que indicadores usaria para acompanhar o impacto de uma formação ou evento?", type: "textarea", maxLength: 650, placeholder: "Indique exemplos de indicadores e porquê." },
        { id: "reporting", label: "Que experiência tem na elaboração de relatórios ou apresentação de resultados?", type: "textarea", maxLength: 600, placeholder: "Inclua ferramentas e exemplos." },
        { id: "monitoringTools", label: "Que ferramentas informáticas sabe usar para organizar dados e acompanhar atividades?", type: "textarea", maxLength: 500, placeholder: "Ex.: Excel, Google Sheets, Forms, dashboards." }
    ],
    tecnicoMateriaisDidaticos: [
        { id: "educationalMaterialsExperience", label: "Que experiência tem na produção de materiais educativos ou pedagógicos?", type: "textarea", maxLength: 650, placeholder: "Inclua fichas, guias, apresentações ou conteúdos." },
        { id: "materialsTools", label: "Que ferramentas utiliza para elaborar ou organizar materiais didáticos?", type: "textarea", maxLength: 500, placeholder: "Ex.: Word, Google Docs, PowerPoint, Canva." },
        { id: "contentOrganization", label: "Como organizaria um conteúdo para que fosse claro e útil para estudantes?", type: "textarea", maxLength: 650, placeholder: "Explique estrutura, linguagem e exemplos." },
        { id: "audienceAdaptation", label: "Como adaptaria materiais para públicos com diferentes níveis de conhecimento?", type: "textarea", maxLength: 650, placeholder: "Descreva critérios e adaptações." },
        { id: "creativeMaterials", label: "Como combina criatividade e rigor na preparação de materiais didáticos?", type: "textarea", maxLength: 600, placeholder: "Explique o seu método de trabalho." }
    ],
    assistenteAdministrativo: [
        { id: "administrativeExperience", label: "Que experiência tem em organização administrativa ou gestão de documentos?", type: "textarea", maxLength: 650, placeholder: "Inclua clubes, projetos, trabalho ou escola." },
        { id: "officeTools", label: "Que ferramentas de escritório sabe utilizar?", type: "textarea", maxLength: 500, placeholder: "Ex.: Word, Excel, Google Docs, Google Sheets." },
        { id: "taskManagement", label: "Como organiza tarefas, prazos e informações para não perder detalhes importantes?", type: "textarea", maxLength: 650, placeholder: "Explique o seu método de organização." },
        { id: "professionalCommunication", label: "Como garantiria uma comunicação profissional em mensagens, documentos e contactos internos?", type: "textarea", maxLength: 600, placeholder: "Descreva tom, clareza e cuidado." },
        { id: "detailAttention", label: "Conte uma situação em que a sua atenção ao detalhe ajudou a evitar ou resolver um problema.", type: "textarea", maxLength: 600, placeholder: "Pode ser uma experiência escolar, profissional ou associativa." }
    ],
    eventos: [
        { id: "eventOrganizationExperience", label: "Que experiência tem na organização de eventos?", type: "textarea", maxLength: 650, placeholder: "Inclua eventos escolares, juvenis, comunitários ou profissionais." },
        { id: "eventLogistics", label: "Que experiência tem com logística, montagem ou preparação física de eventos?", type: "textarea", maxLength: 650, placeholder: "Descreva tarefas práticas que já executou." },
        { id: "eventPressure", label: "Como trabalha sob pressão durante a preparação ou realização de um evento?", type: "textarea", maxLength: 600, placeholder: "Explique como mantém organização e calma." },
        { id: "eventProblemSolving", label: "Como resolveria um problema inesperado durante um evento?", type: "textarea", maxLength: 650, placeholder: "Dê um exemplo de resposta prática." },
        { id: "teamworkInstructions", label: "Como trabalha em equipa e segue orientações da pessoa responsável pelo departamento?", type: "textarea", maxLength: 600, placeholder: "Explique colaboração, comunicação e responsabilidade." }
    ],
    secretario: [
        { id: "secretariatExperience", label: "Que experiência tem em organização, secretaria ou apoio administrativo?", type: "textarea", maxLength: 650, placeholder: "Inclua escola, clubes, associações ou trabalho." },
        { id: "agendaManagement", label: "Como organizaria agendas, reuniões e acompanhamento de tarefas?", type: "textarea", maxLength: 650, placeholder: "Explique método e ferramentas." },
        { id: "minutesDocuments", label: "Que experiência tem na elaboração de atas, documentos ou registos de reunião?", type: "textarea", maxLength: 600, placeholder: "Inclua exemplos, se existirem." },
        { id: "informationManagement", label: "Como garantiria boa gestão de informação interna e atenção ao detalhe?", type: "textarea", maxLength: 650, placeholder: "Descreva organização, confidencialidade e revisão." },
        { id: "taskFollowUp", label: "Como acompanharia tarefas pendentes para garantir que nada fica esquecido?", type: "textarea", maxLength: 600, placeholder: "Explique seguimento, lembretes e comunicação." }
    ]
};

const state = {
    currentPage: 0,
    selectedJob: "",
    files: {},
    submitted: false,
    routingByJob: {}
};

const pages = [...document.querySelectorAll(".page")];
const steps = [...document.querySelectorAll(".step")];
const progress = document.getElementById("progress");
const currentStepText = document.getElementById("currentStepText");
const currentStepName = document.getElementById("currentStepName");
const form = document.getElementById("applicationForm");
const jobGrid = document.getElementById("jobGrid");
const jobDetails = document.getElementById("jobDetails");
const jobError = document.getElementById("jobError");
const documents = document.getElementById("documents");
const documentsError = document.getElementById("documentsError");
const jobQuestions = document.getElementById("jobQuestions");
const review = document.getElementById("review");
const submitMessage = document.getElementById("submitMessage");
const downloadDossierPdfButton = document.getElementById("downloadDossierPdf");

function init() {
    renderJobs();
    renderQuestions();
    bindNavigation();
    bindFieldValidation();
    bindDossierActions();
    restoreDraft();
    updateStep();
    renderDocuments();
}

function renderJobs() {
    jobGrid.innerHTML = Object.entries(jobs).map(([key, job]) => `
        <button type="button" class="job-card" data-job="${key}" aria-pressed="false">
            <i class="fa-solid ${job.icon}" aria-hidden="true"></i>
            <strong>${job.title}</strong>
            ${job.requiresLuanda ? `<span class="location-badge"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Base: Luanda - Presencial</span>` : ""}
            <small>${job.short}</small>
        </button>
    `).join("");

    jobGrid.addEventListener("click", (event) => {
        const card = event.target.closest(".job-card");
        if (!card) return;
        selectJob(card.dataset.job);
    });
}

async function selectJob(jobKey) {
    state.selectedJob = jobKey;
    state.files = {};
    localStorage.setItem("muna_selected_job", jobKey);
    document.querySelectorAll(".job-card").forEach((card) => {
        const selected = card.dataset.job === jobKey;
        card.classList.toggle("selected", selected);
        card.setAttribute("aria-pressed", String(selected));
    });
    jobError.textContent = "";
    renderJobDetails();
    renderDocuments();
    renderQuestions();
    saveDraft();
    await loadRoutingForJob(jobKey);
}

function getQuestionsForJob(jobKey) {
    return [...commonQuestions, ...(questionsByJob[jobKey] || [])];
}

function renderQuestions() {
    if (!jobQuestions) return;
    if (!state.selectedJob) {
        jobQuestions.innerHTML = `
            <div class="notice show">
                <i class="fa-solid fa-circle-info"></i>
                <p>Selecione primeiro um cargo para ver as perguntas específicas da candidatura.</p>
            </div>
        `;
        return;
    }

    const currentData = getFormData();
    jobQuestions.innerHTML = getQuestionsForJob(state.selectedJob).map(renderQuestionField).join("");
    getQuestionsForJob(state.selectedJob).forEach((question) => {
        const field = form.elements[question.id];
        if (field && currentData[question.id]) field.value = currentData[question.id];
    });
    bindDynamicQuestionEvents();
}

function renderQuestionField(question) {
    if (question.type === "select") {
        return `
            <div class="field">
                <label for="${question.id}">${escapeHtml(question.label)} <span>obrigatório</span></label>
                <select id="${question.id}" name="${question.id}" required>
                    <option value="">Selecione uma opção</option>
                    ${question.options.map((option) => `<option>${escapeHtml(option)}</option>`).join("")}
                </select>
                <small class="field-error"></small>
            </div>
        `;
    }

    return `
        <div class="field">
            <label for="${question.id}">${escapeHtml(question.label)} <span>obrigatório</span></label>
            <textarea id="${question.id}" name="${question.id}" maxlength="${question.maxLength || 700}" placeholder="${escapeHtml(question.placeholder || "")}" required></textarea>
            <div class="field-meta"><small class="field-error"></small><small class="counter" data-for="${question.id}"></small></div>
        </div>
    `;
}

function bindDynamicQuestionEvents() {
    jobQuestions.querySelectorAll("textarea[maxlength]").forEach((textarea) => {
        const counter = jobQuestions.querySelector(`.counter[data-for="${textarea.id}"]`);
        const update = () => {
            counter.textContent = `${textarea.value.length} / ${textarea.maxLength} caracteres`;
        };
        textarea.addEventListener("input", update);
        update();
    });

    jobQuestions.querySelectorAll("textarea, select").forEach((field) => {
        field.addEventListener("input", () => {
            validateFields(jobQuestions);
            saveDraft();
        });
        field.addEventListener("blur", () => validateFields(jobQuestions));
    });
}

function renderJobDetails() {
    if (!state.selectedJob) {
        jobDetails.innerHTML = "";
        return;
    }

    const job = jobs[state.selectedJob];
    jobDetails.innerHTML = `
        <article class="details-card">
            <h4>${job.title}</h4>
            <p>${job.description}</p>
            ${job.requiresLuanda ? `
                <div class="location-note">
                    <strong><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Requisito de localização</strong>
                    <p>${LUANDA_REQUIREMENT_TEXT}</p>
                </div>
                <div class="field location-question" id="luandaAvailabilityField">
                    <label for="luandaAvailability">Você reside ou tem disponibilidade para atuar presencialmente em Luanda? <span>obrigatório</span></label>
                    <select id="luandaAvailability" name="luandaAvailability" required>
                        <option value="">Selecione uma opção</option>
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                    </select>
                    <small class="field-error"></small>
                </div>
                <div class="notice error eligibility-message" id="luandaEligibilityMessage" role="alert"></div>
            ` : ""}
            <div class="detail-columns">
                <div>
                    <h5>Requisitos essenciais</h5>
                    <ul>${job.essential.map(item => `<li>${item}</li>`).join("")}</ul>
                </div>
                <div>
                    <h5>Competências valorizadas</h5>
                    <ul>${job.valued.map(item => `<li>${item}</li>`).join("")}</ul>
                </div>
                <div>
                    <h5>Documentos necessários</h5>
                    <ul>${getDocumentsForJob(job).map(doc => `<li>${doc.name}${doc.required ? "" : " (opcional)"}</li>`).join("")}</ul>
                </div>
            </div>
        </article>
    `;

    const luandaAvailability = document.getElementById("luandaAvailability");
    if (luandaAvailability) {
        luandaAvailability.value = getFormData().luandaAvailability || "";
        luandaAvailability.addEventListener("input", () => {
            validateLuandaAvailability();
            saveDraft();
        });
        luandaAvailability.addEventListener("blur", validateLuandaAvailability);
        validateLuandaAvailability();
    }
}

function renderDocuments() {
    if (!state.selectedJob) {
        documents.innerHTML = `
            <article class="document-card">
                <div class="document-head">
                    <div>
                        <h4>Nenhum cargo selecionado</h4>
                        <p>Escolha primeiro um cargo para que os documentos necessários apareçam aqui.</p>
                    </div>
                    <span class="doc-status">Pendente</span>
                </div>
            </article>
        `;
        return;
    }

    const job = jobs[state.selectedJob];
    documents.innerHTML = getDocumentsForJob(job).map((doc) => {
        const file = state.files[doc.id];
        const loaded = Boolean(file);
        return `
            <article class="document-card ${loaded ? "loaded" : ""}" data-doc-id="${doc.id}">
                <div class="document-head">
                    <div>
                        <h4>${doc.name} ${doc.required ? "" : "(opcional)"}</h4>
                        <p>${doc.reason}</p>
                    </div>
                    <span class="doc-status">${loaded ? "Carregado" : "Pendente"}</span>
                </div>
                <label class="upload-zone" for="doc-${doc.id}">
                    <i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
                    <span>
                        <strong>${loaded ? file.name : "Arraste o ficheiro para aqui"}</strong>
                        <small>${loaded ? formatFileSize(file.size) : `Ou escolha um ficheiro. Formatos: ${ACCEPTED_EXTENSIONS.join(", ").toUpperCase()}. Máx. ${MAX_FILE_SIZE_MB} MB.`}</small>
                    </span>
                    <span class="btn btn-secondary">Escolher ficheiro</span>
                    <input id="doc-${doc.id}" class="upload-input" type="file" accept="${ACCEPTED_EXTENSIONS.map(ext => `.${ext}`).join(",")}" data-doc-id="${doc.id}">
                </label>
                <div class="file-actions">
                    ${loaded ? `<button type="button" class="text-button" data-replace="${doc.id}">Substituir ficheiro</button><button type="button" class="text-button remove" data-remove="${doc.id}">Remover ficheiro</button>` : ""}
                </div>
                <small class="field-error" data-doc-error="${doc.id}"></small>
            </article>
        `;
    }).join("");

    bindUploadEvents();
}

function bindUploadEvents() {
    documents.querySelectorAll(".upload-input").forEach((input) => {
        input.addEventListener("change", () => {
            handleFile(input.dataset.docId, input.files[0]);
        });
    });

    documents.querySelectorAll(".upload-zone").forEach((zone) => {
        zone.addEventListener("dragover", (event) => {
            event.preventDefault();
            zone.classList.add("dragging");
        });
        zone.addEventListener("dragleave", () => zone.classList.remove("dragging"));
        zone.addEventListener("drop", (event) => {
            event.preventDefault();
            zone.classList.remove("dragging");
            const input = zone.querySelector(".upload-input");
            handleFile(input.dataset.docId, event.dataTransfer.files[0]);
        });
    });

    documents.querySelectorAll("[data-remove]").forEach((button) => {
        button.addEventListener("click", () => {
            delete state.files[button.dataset.remove];
            documentsError.textContent = "";
            renderDocuments();
        });
    });

    documents.querySelectorAll("[data-replace]").forEach((button) => {
        button.addEventListener("click", () => {
            document.getElementById(`doc-${button.dataset.replace}`).click();
        });
    });
}

function handleFile(docId, file) {
    const errorEl = documents.querySelector(`[data-doc-error="${docId}"]`);
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
        if (errorEl) errorEl.textContent = `Formato inválido. Use: ${ACCEPTED_EXTENSIONS.join(", ").toUpperCase()}.`;
        return;
    }

    if (file.size > maxBytes) {
        if (errorEl) errorEl.textContent = `Ficheiro demasiado grande. O limite é ${MAX_FILE_SIZE_MB} MB.`;
        return;
    }

    state.files[docId] = file;
    documentsError.textContent = "";
    renderDocuments();
}

function bindNavigation() {
    document.querySelectorAll("[data-next]").forEach((button) => {
        button.addEventListener("click", async () => {
            if (!validateCurrentPage()) return;
            if (state.currentPage < pages.length - 1) {
                state.currentPage += 1;
                if (state.currentPage === pages.length - 1) await renderReview();
                updateStep();
            }
        });
    });

    document.querySelectorAll("[data-back]").forEach((button) => {
        button.addEventListener("click", () => {
            if (state.currentPage > 0) {
                state.currentPage -= 1;
                updateStep();
            }
        });
    });

    form.addEventListener("submit", handleSubmit);
}

function updateStep() {
    pages.forEach((page, index) => page.classList.toggle("active", index === state.currentPage));
    steps.forEach((step, index) => step.classList.toggle("active", index <= state.currentPage));
    progress.style.width = `${(state.currentPage / (pages.length - 1)) * 100}%`;
    currentStepText.textContent = String(state.currentPage + 1);
    currentStepName.textContent = pages[state.currentPage].dataset.stepName;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateCurrentPage() {
    const page = pages[state.currentPage];
    let valid = validateFields(page);

    if (state.currentPage === 1 && !state.selectedJob) {
        jobError.textContent = "Selecione um cargo antes de continuar.";
        valid = false;
    }

    if (state.currentPage === 1 && state.selectedJob) {
        valid = validateLuandaAvailability() && valid;
    }

    if (state.currentPage === 3) {
        valid = validateDocuments() && valid;
    }

    if (!valid) {
        const firstInvalid = page.querySelector(".invalid input, .invalid textarea, .invalid select, .form-error:not(:empty), .field-error:not(:empty)");
        if (firstInvalid) firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return valid;
}

function selectedJobRequiresLuanda() {
    return Boolean(state.selectedJob && jobs[state.selectedJob].requiresLuanda);
}

function getDocumentsForJob(job) {
    const baseDocs = job.documents || [];
    const generalDocs = [
        {
            id: "coverLetter",
            name: "Carta de motivacao",
            reason: "Opcionalmente anexe uma carta de motivacao em ficheiro, alem das respostas preenchidas no formulario.",
            required: false
        },
        {
            id: "otherDocuments",
            name: "Outros documentos",
            reason: "Anexe certificados, comprovativos ou materiais adicionais relevantes para a candidatura.",
            required: false
        }
    ];
    const existingIds = new Set(baseDocs.map((doc) => doc.id));
    return [...baseDocs, ...generalDocs.filter((doc) => !existingIds.has(doc.id))];
}

function validateLuandaAvailability() {
    if (!selectedJobRequiresLuanda()) return true;

    const field = document.getElementById("luandaAvailability");
    const wrapper = document.getElementById("luandaAvailabilityField");
    const error = wrapper ? wrapper.querySelector(".field-error") : null;
    const message = document.getElementById("luandaEligibilityMessage");
    if (!field) return true;

    let errorText = "";
    if (!field.value) {
        errorText = "Este campo é obrigatório.";
    } else if (field.value === "Não") {
        errorText = LUANDA_INELIGIBLE_TEXT;
    }

    if (wrapper) wrapper.classList.toggle("invalid", Boolean(errorText));
    if (error) error.textContent = field.value === "Não" ? "" : errorText;
    if (message) {
        message.classList.toggle("show", field.value === "Não");
        message.innerHTML = field.value === "Não"
            ? `<i class="fa-solid fa-circle-info"></i><p>${LUANDA_INELIGIBLE_TEXT}</p>`
            : "";
    }

    return !errorText;
}

function validateFields(scope) {
    let valid = true;
    scope.querySelectorAll("input, textarea, select").forEach((field) => {
        if (field.type === "file") return;
        const wrapper = field.closest(".field");
        const error = wrapper ? wrapper.querySelector(".field-error") : null;
        const value = field.value.trim();
        let message = "";

        if (field.required && !value) {
            message = "Este campo é obrigatório.";
        } else if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            message = "Indique um e-mail válido.";
        } else if (field.type === "url" && value && !isValidUrl(value)) {
            message = "Indique um link válido, começando por https://.";
        } else if (field.id === "phone" && value && !/^9\d{8}$/.test(value)) {
            message = "Indique um telefone angolano com 9 dígitos, começando por 9.";
        } else if (field.id === "age" && value && (Number(value) < 14 || Number(value) > 35)) {
            message = "Indique uma idade entre 14 e 35 anos.";
        }

        if (wrapper) wrapper.classList.toggle("invalid", Boolean(message));
        if (error) error.textContent = message;
        if (message) valid = false;
    });
    return valid;
}

function validateDocuments() {
    documentsError.textContent = "";
    if (!state.selectedJob) {
        documentsError.textContent = "Selecione um cargo antes de carregar documentos.";
        return false;
    }

    const missing = getDocumentsForJob(jobs[state.selectedJob]).filter((doc) => doc.required && !state.files[doc.id]);
    if (missing.length) {
        documentsError.textContent = `Carregue os documentos obrigatórios: ${missing.map(doc => doc.name).join(", ")}.`;
        return false;
    }
    return true;
}

function bindFieldValidation() {
    form.querySelectorAll("input, textarea, select").forEach((field) => {
        if (field.type === "file") return;
        field.addEventListener("input", () => {
            if (field.id === "phone") field.value = field.value.replace(/\D/g, "").slice(0, 9);
            validateFields(field.closest(".page") || form);
            saveDraft();
        });
        field.addEventListener("blur", () => validateFields(field.closest(".page") || form));
    });
}

function bindCounters() {
    document.querySelectorAll("textarea[maxlength]").forEach((textarea) => {
        const counter = document.querySelector(`.counter[data-for="${textarea.id}"]`);
        const update = () => {
            counter.textContent = `${textarea.value.length} / ${textarea.maxLength} caracteres`;
        };
        textarea.addEventListener("input", update);
        update();
    });
}

function bindDossierActions() {
    if (downloadDossierPdfButton) {
        downloadDossierPdfButton.addEventListener("click", () => {
            if (!state.selectedJob) return;
            downloadDossierPdf(buildApplicationRecord());
        });
    }
}

async function loadRoutingForJob(jobKey) {
    if (!jobKey || state.routingByJob[jobKey]) return state.routingByJob[jobKey] || [];
    try {
        const response = await fetch(`/api/routing/${encodeURIComponent(jobKey)}`);
        if (!response.ok) throw new Error("Nao foi possivel carregar os responsaveis.");
        const data = await response.json();
        state.routingByJob[jobKey] = data.recipients || [];
    } catch {
        state.routingByJob[jobKey] = [];
    }
    return state.routingByJob[jobKey];
}

async function renderReview() {
    await loadRoutingForJob(state.selectedJob);
    const record = buildApplicationRecord();
    const data = record.data;
    const selected = jobs[state.selectedJob];
    const recipients = record.routing.recipients
        .map((recipient) => `${escapeHtml(recipient.name)} - ${escapeHtml(recipient.role)}`)
        .join("<br>");
    const answerRows = record.answers
        .filter((row) => !["Nome completo", "Cargo", "E-mail", "Telefone/WhatsApp", "Localização", "Idade", "Escola / Universidade / Profissão", "LinkedIn", "Redes sociais", "Disponibilidade presencial em Luanda"].includes(row.label))
        .map((row) => `<div class="review-item full"><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.answer).replaceAll("\n", "<br>")}</span></div>`)
        .join("");
    const uploadedDocs = record.documents.map((doc) => (
        `${escapeHtml(doc.name)}: ${doc.fileName ? `${escapeHtml(doc.fileName)} - Ver/Baixar após envio seguro` : "não carregado"}`
    )).join("<br>");

    review.innerHTML = `
        <div class="review-grid">
            <div class="review-item"><strong>Nome</strong><span>${escapeHtml(data.fullName)}</span></div>
            <div class="review-item"><strong>Cargo</strong><span>${escapeHtml(selected.title)}</span></div>
            <div class="review-item"><strong>Idade</strong><span>${escapeHtml(data.age)}</span></div>
            <div class="review-item"><strong>Localização</strong><span>${escapeHtml(data.city)}, ${escapeHtml(data.province)}</span></div>
            <div class="review-item"><strong>E-mail</strong><span>${escapeHtml(data.email)}</span></div>
            <div class="review-item"><strong>Telefone</strong><span>${escapeHtml(data.phone)}</span></div>
            <div class="review-item full"><strong>Escola / Universidade / Profissão</strong><span>${escapeHtml(data.institution)}</span></div>
            ${selected.requiresLuanda ? `<div class="review-item full"><strong>Disponibilidade presencial em Luanda</strong><span>${escapeHtml(data.luandaAvailability)}</span></div>` : ""}
            <div class="review-item full"><strong>Destinatários</strong><span>${recipients}</span></div>
            <div class="review-item full"><strong>Assunto do e-mail</strong><span>${escapeHtml(record.emailSubject)}</span></div>
            <div class="review-item full"><strong>Documentos</strong><span>${uploadedDocs}</span></div>
            ${answerRows}
            <div class="review-item full"><strong>Resumo do dossiê</strong><span>O e-mail incluirá tabela profissional com respostas, documentos, data/hora e opção de baixar o dossiê completo.</span></div>
        </div>
    `;
}

async function handleSubmit(event) {
    event.preventDefault();
    if (state.submitted) return;
    submitMessage.className = "submit-message";
    submitMessage.innerHTML = "";

    const allValid = pages.every((page) => validateFields(page)) && state.selectedJob && validateLuandaAvailability() && validateDocuments();
    if (!allValid) {
        submitMessage.classList.add("show", "error");
        submitMessage.innerHTML = `<i class="fa-solid fa-circle-xmark"></i><p>Existem campos por corrigir antes de enviar a candidatura.</p>`;
        return;
    }

    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> A enviar`;
    const record = buildApplicationRecord();

    try {
        const payload = buildPayload(record, getCurrentFileEntries());
        const response = await fetch(SUBMISSION_ENDPOINT, {
            method: "POST",
            body: payload
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(result.error || "Falha no envio");
        state.submitted = true;
        submitMessage.classList.add("show", "success");
        submitMessage.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            <p><strong>✅ Candidatura enviada com sucesso!</strong><br>A sua candidatura foi recebida pela Model UN Academy Luanda Chapter. A equipa responsável analisará as informações submetidas.</p>
        `;
        localStorage.removeItem("muna_draft");
        localStorage.removeItem("muna_selected_job");
    } catch (error) {
        submitMessage.classList.add("show", "error");
        submitMessage.innerHTML = `<i class="fa-solid fa-circle-xmark"></i><p>Não foi possível enviar a candidatura neste momento. Verifique a sua conexão e tente novamente.</p>`;
        button.disabled = false;
        button.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Enviar candidatura`;
        return;
    } finally {
        if (!state.submitted) button.disabled = false;
    }
}
function buildPayload(record, fileEntries = getCurrentFileEntries()) {
    const payload = new FormData();
    Object.entries(record.data).forEach(([key, value]) => payload.append(key, value));
    payload.append("applicationId", record.id);
    payload.append("submittedAt", record.submittedAt);
    payload.append("selectedJob", record.job.key);
    payload.append("selectedJobTitle", record.job.title);
    payload.append("emailSubject", record.emailSubject);
    payload.append("recipients", JSON.stringify(record.routing.recipients));
    payload.append("dossier", JSON.stringify(record));
    payload.append("emailHtml", record.emailHtml);
    payload.append("emailText", record.emailText);
    fileEntries.forEach(({ docId, file }) => payload.append(`document_${docId}`, file));
    return payload;
}

function getRoutingForJob(jobKey) {
    return state.routingByJob[jobKey] || [];
}
function buildApplicationRecord() {
    const data = getFormData();
    const selected = jobs[state.selectedJob];
    const now = new Date();
    const recipients = getRoutingForJob(state.selectedJob);
    const answers = buildDossierRows(data, selected);
    const documentsList = getDocumentsForJob(selected).map((doc) => {
        const file = state.files[doc.id];
        return {
            id: doc.id,
            name: doc.name,
            required: doc.required,
            fileName: file ? file.name : "",
            fileSize: file ? file.size : 0,
            status: file ? "Carregado para envio seguro" : "Não carregado",
            action: file ? "Ver/Baixar após armazenamento seguro no servidor" : "Pendente"
        };
    });
    const record = {
        id: `MUNA-${now.getTime()}`,
        organization: ORGANIZATION_NAME,
        submittedAt: now.toISOString(),
        submittedAtDisplay: now.toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" }),
        job: {
            key: state.selectedJob,
            title: selected.title,
            requiresLuanda: Boolean(selected.requiresLuanda)
        },
        data,
        answers,
        documents: documentsList,
        routing: {
            recipients,
            recipientEmails: recipients.map((recipient) => recipient.email)
        },
        emailSubject: `Nova candidatura — ${selected.title} | ${ORGANIZATION_NAME}`
    };
    record.emailHtml = buildEmailHtml(record);
    record.emailText = buildEmailText(record);
    return record;
}

function buildDossierRows(data, selected) {
    const rows = [
        ["Nome completo", data.fullName],
        ["Cargo", selected.title],
        ["E-mail", data.email],
        ["Telefone/WhatsApp", data.phone],
        ["Localização", `${data.city || ""}, ${data.province || ""}`.replace(/^,\s*|,\s*$/g, "")],
        ["Idade", data.age],
        ["Escola / Universidade / Profissão", data.institution],
        ["LinkedIn", data.linkedin || "Não informado"],
        ["Redes sociais", data.socials || "Não informado"],
        ...getQuestionsForJob(state.selectedJob).map((question) => [question.label, data[question.id]])
    ];

    if (selected.requiresLuanda) {
        rows.splice(5, 0, ["Disponibilidade presencial em Luanda", data.luandaAvailability]);
    }

    return rows.map(([label, answer]) => ({ label, answer: answer || "Não informado" }));
}

function buildEmailHtml(record) {
    const rows = record.answers.map((row) => `
        <tr>
            <th>${escapeHtml(row.label)}</th>
            <td>${escapeHtml(row.answer).replaceAll("\n", "<br>")}</td>
        </tr>
    `).join("");
    const docs = record.documents.map((doc) => `
        <li><strong>${escapeHtml(doc.name)}</strong> → ${escapeHtml(doc.action)}${doc.fileName ? ` (${escapeHtml(doc.fileName)})` : ""}</li>
    `).join("");

    return `
        <div style="font-family: Arial, sans-serif; color: #172033;">
            <h2 style="margin-bottom: 4px;">Nova candidatura recebida</h2>
            <p style="margin-top: 0;">${escapeHtml(ORGANIZATION_NAME)}</p>
            <table style="border-collapse: collapse; width: 100%; margin: 18px 0;">
                <tbody>${rows}</tbody>
            </table>
            <h3>📎 DOCUMENTOS DA CANDIDATURA</h3>
            <ul>${docs}</ul>
            <p><strong>Formulário completo</strong> → Ver candidatura no sistema</p>
            <p><strong>📥 Baixar dossiê completo</strong> → Disponível no painel/endpoint de candidaturas.</p>
            <p><strong>Data e hora da candidatura:</strong> ${escapeHtml(record.submittedAtDisplay)}</p>
        </div>
    `;
}

function buildEmailText(record) {
    const rows = record.answers.map((row) => `${row.label}: ${row.answer}`).join("\n");
    const docs = record.documents.map((doc) => `${doc.name}: ${doc.action}${doc.fileName ? ` (${doc.fileName})` : ""}`).join("\n");
    return `${ORGANIZATION_NAME}\n${record.emailSubject}\n\n${rows}\n\nDOCUMENTOS DA CANDIDATURA\n${docs}\n\nData e hora: ${record.submittedAtDisplay}`;
}

function getCurrentFileEntries() {
    return Object.entries(state.files).map(([docId, file]) => ({ docId, file }));
}

function downloadDossierPdf(record) {
    const pdf = createSimplePdf(record);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dossie-${record.job.key}-${record.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
}

function createSimplePdf(record) {
    const lines = [
        ORGANIZATION_NAME,
        "Dossiê completo da candidatura",
        record.emailSubject,
        `Data e hora: ${record.submittedAtDisplay}`,
        "",
        ...record.answers.map((row) => `${row.label}: ${row.answer}`),
        "",
        "DOCUMENTOS DA CANDIDATURA",
        ...record.documents.map((doc) => `${doc.name}: ${doc.fileName || "Não carregado"} - ${doc.action}`),
        "",
        `Destinatários: ${record.routing.recipientEmails.join(", ")}`
    ];
    return buildPdfFromLines(lines);
}

function buildPdfFromLines(lines) {
    const objects = [];
    const escapedLines = lines.flatMap((line) => wrapPdfText(String(line), 96));
    const text = escapedLines.map((line, index) => `BT /F1 10 Tf 50 ${790 - (index * 14)} Td (${escapePdfText(line)}) Tj ET`).join("\n");
    objects.push("<< /Type /Catalog /Pages 2 0 R >>");
    objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
    objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>");
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    objects.push(`<< /Length ${text.length} >>\nstream\n${text}\nendstream`);
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
        offsets.push(pdf.length);
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
        pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return pdf;
}

function wrapPdfText(text, size) {
    if (!text) return [""];
    const words = text.replace(/\s+/g, " ").split(" ");
    const lines = [];
    let line = "";
    words.forEach((word) => {
        if (`${line} ${word}`.trim().length > size) {
            lines.push(line);
            line = word;
        } else {
            line = `${line} ${word}`.trim();
        }
    });
    if (line) lines.push(line);
    return lines;
}

function escapePdfText(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[()\\]/g, "\\$&");
}

function getFormData() {
    return Object.fromEntries(new FormData(form).entries());
}

function saveDraft() {
    const data = getFormData();
    localStorage.setItem("muna_draft", JSON.stringify(data));
}

function restoreDraft() {
    const rawDraft = localStorage.getItem("muna_draft");
    let draft = {};
    if (rawDraft) {
        try {
            draft = JSON.parse(rawDraft);
            applyFormValues(draft);
        } catch {
            localStorage.removeItem("muna_draft");
        }
    }

    const savedJob = localStorage.getItem("muna_selected_job");
    if (savedJob && jobs[savedJob]) {
        selectJob(savedJob);
        applyFormValues(draft);
        const luandaAvailability = document.getElementById("luandaAvailability");
        if (luandaAvailability && draft.luandaAvailability) {
            luandaAvailability.value = draft.luandaAvailability;
            validateLuandaAvailability();
        }
    }
}

function applyFormValues(values) {
    Object.entries(values).forEach(([name, value]) => {
        const field = form.elements[name];
        if (field && field.type !== "file") field.value = value;
    });
    if (jobQuestions) bindDynamicQuestionEvents();
}

function isValidUrl(value) {
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

init();
