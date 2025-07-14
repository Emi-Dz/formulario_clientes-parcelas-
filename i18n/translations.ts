
export const translations: { [key: string]: { [key: string]: string } } = {
    es: {
        // Header
        appTitle: 'Gestión de Clientes',

        // Language Switcher
        es: 'ES',
        pt: 'PT',

        // Home Page
        welcome: 'Bienvenido',
        welcomeSubtitle: 'Seleccione una opción para comenzar.',
        home_newClient: 'Cargar Nuevo Cliente',
        home_viewClients: 'Ver Clientes Existentes',

        // Client List Page
        clientListTitle: 'Lista de Clientes',
        newButton: 'Cargar Nuevo',
        noClients: 'No hay clientes cargados todavía.',
        colClient: 'Cliente',
        colProduct: 'Producto',
        colTotal: 'Total',
        colPurchaseDate: 'Fecha Compra',
        colEdit: 'Editar',
        editButton: 'Editar',

        // Form Page Titles
        formTitleNew: 'Cargar Nuevo Cliente',
        formTitleEdit: 'Editar Cliente',

        // Form Section Legends
        clientDetails: 'Detalles del Cliente',
        saleDetails: 'Detalles de la Venta',
        locations: 'Ubicaciones',
        references: 'Referencias y Contacto',
        photos: 'Fotos',
        
        // Form Fields Labels
        sobrenomeENome: 'Apellido y Nombre',
        cpf: 'CPF',
        purchaseDate: 'Fecha de Compra',
        telefone: 'Teléfono',
        produtos: 'Productos',
        totalProductPrice: 'Precio Total del Producto',
        downPayment: 'Anticipo',
        installments: 'Cantidad de Cuotas',
        installmentPrice: 'Precio por Cuota (Calculado)',
        paymentSystem: 'Sistema de Pago',
        reference1Name: 'Nombre Referencia 1',
        reference1Relationship: 'Parentesco / Teléfono',
        reference2Name: 'Nombre Referencia 2',
        reference2Relationship: 'Parentesco / Teléfono',
        espanol: 'Español',
        portugues: 'Portugués',
        language: 'Idioma del Cliente',
        storeName: 'Nombre Tienda',
        localizacaoTrab: 'Ubicación Trabajo',
        enderecoTrab: 'Dirección Trabajo',
        localizacaoCasa: 'Ubicación Casa',
        enderecoCasa: 'Dirección Casa',
        fotoLoja: 'Foto Tienda',
        fotoContrato: 'FOTO CONTRATO (FRENTE Y VERSO)',
        fotoDocumentos: 'FOTOS DOCUMENTOS (RG Y CPF)',
        fotoCasa: 'Foto Casa',
        fotoCodigoTelefono: 'Foto Código Teléfono',
        frente: 'Frente',
        verso: 'Verso',
        cpfPhoto: 'CPF',
        clientType: 'Tipo de Cliente',
        logista: 'Logista',
        funcionario: 'Funcionario',
        diario: 'Diario',
        semanal: 'Semanal',
        mensal: 'Mensual',
        paymentStartDate: 'Fecha de Inicio de Pago',
        vendedor: 'Vendedor',
        guarantor: 'Garante',
        instagramFace: 'Foto Perfil Instagram',
        obs: 'Observaciones',

        // Placeholders
        placeholder_clientName: 'Ej: Juan Pérez',
        placeholder_phone: 'Ej: 21 98765-4321',
        placeholder_product: 'Ej: Xiaomi Poco C75',
        placeholder_storeName: 'Ej: Xatus Beer',
        placeholder_vendedor: 'Ej: Patrick',
        placeholder_guarantor: 'Ej: Nombre del garante',
        placeholder_location: 'Ej: Ingleses',
        placeholder_address: 'Ej: Rod. João Gualberto Soares 730',
        placeholder_refName: 'Ej: María Silva',
        placeholder_refRelationship: 'Ej: Esposa / 21 98765-4321',
        placeholder_instagram: 'Ej: @usuario o facebook.com/usuario',
        placeholder_notes: 'Escriba cualquier observación adicional aquí...',
        placeholder_select: 'Seleccione una opción...',


        // Form Buttons & Messages
        cancel: 'Cancelar',
        loading: 'Procesando...',
        loading_sheets: 'Enviando al servidor...',
        loading_saving: 'Guardando cliente...',
        loading_excel: 'Generando Excel...',
        saveChanges: 'Guardar Cambios',
        submitAndGenerate: 'Cargar y Generar Excel',
        
        // App Level Messages
        successUpdate: 'Cliente {{clientName}} actualizado exitosamente!',
        successNew: 'Nuevo cliente cargado exitosamente!',
        errorPrefix: 'Error',
        errorUnknown: 'Ocurrió un error desconocido.',
        error_sheets_fallback: 'Error al conectar con el servidor. El cliente se guardó localmente de todas formas.',

    },
    pt: {
        // Header
        appTitle: 'Gerenciamento de Clientes',

        // Language Switcher
        es: 'ES',
        pt: 'PT',

        // Home Page
        welcome: 'Bem-vindo',
        welcomeSubtitle: 'Selecione uma opção para começar.',
        home_newClient: 'Carregar Novo Cliente',
        home_viewClients: 'Ver Clientes Existentes',

        // Client List Page
        clientListTitle: 'Lista de Clientes',
        newButton: 'Carregar Novo',
        noClients: 'Nenhum cliente carregado ainda.',
        colClient: 'Cliente',
        colProduct: 'Produto',
        colTotal: 'Total',
        colPurchaseDate: 'Data da Compra',
        colEdit: 'Editar',
        editButton: 'Editar',
        
        // Form Page Titles
        formTitleNew: 'Carregar Novo Cliente',
        formTitleEdit: 'Editar Cliente',

        // Form Section Legends
        clientDetails: 'Detalhes do Cliente',
        saleDetails: 'Detalhes da Venda',
        locations: 'Localizações',
        references: 'Referências e Contato',
        photos: 'Fotos',

        // Form Fields Labels
        sobrenomeENome: 'Sobrenome e Nome',
        cpf: 'CPF',
        purchaseDate: 'Data da Compra',
        telefone: 'Telefone',
        produtos: 'Produtos',
        totalProductPrice: 'Preço Total do Produto',
        downPayment: 'Entrada',
        installments: 'Quantidade de Parcelas',
        installmentPrice: 'Preço por Parcela (Calculado)',
        paymentSystem: 'Sistema de Pagamento',
        reference1Name: 'Nome Referência 1',
        reference1Relationship: 'Parentesco / Telefone',
        reference2Name: 'Nome Referência 2',
        reference2Relationship: 'Parentesco / Telefone',
        espanol: 'Espanhol',
        portugues: 'Português',
        language: 'Idioma do Cliente',
        storeName: 'Nome da Loja',
        localizacaoTrab: 'Localização Trab.',
        enderecoTrab: 'Endereço Trab.',
        localizacaoCasa: 'Localização Casa',
        enderecoCasa: 'Endereço Casa',
        fotoLoja: 'Foto Loja',
        fotoContrato: 'FOTO CONTRATO (FRENTE E VERSO)',
        fotoDocumentos: 'FOTOS DOCUMENTOS (RG E CPF)',
        fotoCasa: 'Foto Casa',
        fotoCodigoTelefono: 'Foto Código Telefone',
        frente: 'Frente',
        verso: 'Verso',
        cpfPhoto: 'CPF',
        clientType: 'Tipo de Cliente',
        logista: 'Logista',
        funcionario: 'Funcionário',
        diario: 'Diário',
        semanal: 'Semanal',
        mensal: 'Mensal',
        paymentStartDate: 'Data de Início do Pagamento',
        vendedor: 'Vendedor',
        guarantor: 'Garante',
        instagramFace: 'Foto Perfil Instagram',
        obs: 'Observações',
        
        // Placeholders
        placeholder_clientName: 'Ex: João da Silva',
        placeholder_phone: 'Ex: 21 98765-4321',
        placeholder_product: 'Ex: Xiaomi Poco C75',
        placeholder_storeName: 'Ex: Xatus Beer',
        placeholder_vendedor: 'Ex: Patrick',
        placeholder_guarantor: 'Ex: Nome do garante',
        placeholder_location: 'Ex: Ingleses',
        placeholder_address: 'Ex: Rod. João Gualberto Soares 730',
        placeholder_refName: 'Ex: Maria Souza',
        placeholder_refRelationship: 'Ex: Esposa / 21 98765-4321',
        placeholder_instagram: 'Ex: @usuario ou facebook.com/usuario',
        placeholder_notes: 'Escreva quaisquer observações adicionais aqui...',
        placeholder_select: 'Selecione uma opção...',

        // Form Buttons & Messages
        cancel: 'Cancelar',
        loading: 'Processando...',
        loading_sheets: 'Enviando para o servidor...',
        loading_saving: 'Salvando cliente...',
        loading_excel: 'Gerando Excel...',
        saveChanges: 'Salvar Alterações',
        submitAndGenerate: 'Carregar e Gerar Excel',

        // App Level Messages
        successUpdate: 'Cliente {{clientName}} atualizado com sucesso!',
        successNew: 'Novo cliente carregado com sucesso!',
        errorPrefix: 'Erro',
        errorUnknown: 'Ocorreu um erro desconhecido.',
        error_sheets_fallback: 'Erro ao enviar para o servidor. O cliente foi salvo localmente de qualquer maneira.',
    },
};
