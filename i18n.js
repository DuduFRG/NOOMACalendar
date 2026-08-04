/* NOOMA Calendar — sistema de traducao (PT/EN/ES).
 * Arquivo separado do app.js para reduzir o tamanho do arquivo principal
 * (texto de tradução raramente muda, então o navegador pode cachear isso
 * separadamente do código que muda com mais frequência).
 * Carregado como <script> classico ANTES do app.js (mesma convenção do
 * icons.js) — os identificadores abaixo (t, setLang, I18N, etc.) ficam
 * disponíveis globalmente para o app.js consumir sem import/export. */

const I18N = {
  pt: {
    'nav.calendar':'Calend\u00E1rio', 'nav.projects':'Projetos',
    'sidebar.clients':'Clientes', 'sidebar.contentTypes':'Tipos de Conte\u00FAdo', 'sidebar.filters':'Filtros',
    'sidebar.manageClients':'Gerenciar Clientes', 'sidebar.manageTypes':'Gerenciar Tipos',
    'sidebar.clearFilters':'Limpar Filtros', 'sidebar.client':'Cliente', 'sidebar.contentType':'Tipo de Conte\u00FAdo',
    'sidebar.platform':'Plataforma', 'sidebar.allClients':'Todos os clientes', 'sidebar.allTypes':'Todos os tipos',
    'sidebar.allPlatforms':'Todas as plataformas',
    'view.month':'M\u00EAs', 'view.week':'Sem.', 'view.list':'Lista',
    'login.signin':'Entrar', 'login.signup':'Criar conta', 'login.email':'E-mail', 'login.password':'Senha',
    'login.forgot':'Esqueci minha senha', 'login.or':'ou', 'login.google':'Entrar com Google', 'login.apple':'Entrar com Apple', 'login.terms':'Ao criar uma conta, voc\u00ea concorda com nossos termos de uso.',
    'login.fullname':'Nome completo', 'login.phone':'Celular com DDD', 'login.createAccount':'Criar minha conta',
    'login.fullnamePh':'Nome completo *', 'login.phonePh':'Celular com DDD *', 'login.emailPh':'E-mail *',
    'login.passwordPh':'Senha (min. 6 caracteres) *', 'login.orSignupWith':'ou cadastre com', 'login.continueGoogle':'Continuar com Google',
    'profile.title':'Meu Perfil', 'profile.subtitle':'Personalize sua conta', 'profile.name':'Nome completo',
    'profile.phone':'Celular', 'profile.email':'E-mail', 'profile.save':'Salvar altera\u00E7\u00F5es', 'profile.logout':'Sair',
    'proj.allProjects':'Todos os Projetos', 'proj.newProject':'Novo Projeto', 'proj.search':'Buscar projeto...',
    'proj.sortDeadline':'Prazo', 'proj.sortUrgency':'Urg\u00EAncia', 'proj.sortClient':'Cliente A-Z', 'proj.sortValue':'Valor', 'proj.searchPh':'\uD83D\uDD0D Buscar projeto...',
    'common.save':'Salvar', 'common.cancel':'Cancelar', 'common.delete':'Excluir', 'common.create':'Criar',
    'common.close':'Fechar', 'common.loading':'Carregando...', 'toast.error':'\u274C Erro: {msg}', 'toast.enterName':'\u26A0\uFE0F Digite o nome',
    'auth.userNotFound':'Usu\u00E1rio n\u00E3o encontrado.', 'auth.wrongPassword':'Senha incorreta.',
    'auth.invalidCredential':'E-mail ou senha inv\u00E1lidos.', 'auth.invalidEmail':'E-mail inv\u00E1lido.',
    'auth.tooManyRequests':'Muitas tentativas. Tente mais tarde.', 'auth.emailInUse':'Este e-mail j\u00E1 est\u00E1 cadastrado.',
    'auth.weakPassword':'Senha muito fraca (min. 6 caracteres).', 'auth.wrongPasswordCurrent':'Senha atual incorreta.',
    'auth.requiresRecentLogin':'Fa\u00E7a login novamente para alterar a senha.', 'pwa.subtitle':'Acesse mais r\u00E1pido', 'pwa.install':'Instalar',
    'analytics.title':'Analytics', 'analytics.subtitle':'Vis\u00E3o exclusiva do administrador',
    'charts.title':'An\u00E1lise de Conte\u00FAdo', 'charts.subtitle':'Vis\u00E3o geral de todas as postagens',
    'report.title':'Relat\u00F3rio de Projetos Conclu\u00EDdos', 'report.sheetName':'Projetos Conclu\u00EDdos',
    'report.client':'Cliente', 'report.project':'Projeto', 'report.services':'Servi\u00E7os', 'report.owners':'Respons\u00E1veis',
    'report.deadline':'Prazo', 'report.total':'Valor Total', 'report.paid':'Recebido', 'report.pending':'Pendente',
    'report.checklist':'Entregas', 'report.completedAt':'Conclu\u00EDdo em', 'report.empty':'\u26A0\uFE0F Nenhum projeto conclu\u00EDdo para exportar',
    'report.exported':'\u2705 Relat\u00F3rio exportado!', 'report.libsLoadError':'\u26A0\uFE0F Erro ao carregar as bibliotecas de exporta\u00E7\u00E3o. Verifique sua conex\u00E3o e tente novamente.', 'report.projectsCount':'projetos', 'report.status':'Status',
    'export.title':'Exportar Relat\u00F3rio', 'export.subtitle':'Escolha quais projetos incluir',
    'export.presetCompleted':'Apenas Conclu\u00EDdos', 'export.presetAll':'Todos os Status', 'export.presetNone':'Limpar',
    'export.selectStatuses':'Status a incluir', 'export.excel':'Excel (.xlsx)', 'export.pdf':'PDF', 'export.word':'Word (.doc)',
    'profile.replayTutorial':'Ver tutorial novamente', 'profile.contactSupport':'Falar com o suporte',
    'hdr.language':'Idioma', 'hdr.search':'Buscar', 'hdr.settings':'Configura\u00E7\u00F5es', 'hdr.wsSettings':'Config. Workspace', 'hdr.analytics':'Analytics',
    'common.close':'Fechar', 'hdr.sidebar':'Menu', 'hdr.settingsFull':'Configura\u00E7\u00F5es (Plataformas + Status)', 'hdr.pendingRequests':'Pedidos de entrada pendentes',
    'hdr.notifications':'Notifica\u00E7\u00F5es', 'hdr.moreOptions':'Mais op\u00E7\u00F5es',
    'fab.manageClients':'Gerenciar Clientes', 'fab.manageTypes':'Gerenciar Tipos de Conte\u00FAdo', 'proj.configStatus':'Configurar Status', 'proj.colsByStatus':'Colunas por Status', 'proj.colsByOwner':'Colunas por Respons\u00E1vel',
    'pm.noOwners':'Nenhum respons\u00E1vel adicionado', 'pm.workspaceMember':'Membro do workspace', 'pm.customOwner':'Respons\u00E1vel personalizado',
    'pm.noWorkspaceMembers':'Voc\u00EA ainda n\u00E3o tem outros membros neste workspace', 'pm.pickWorkspaceMember':'Escolher do workspace',
    'pm.ownerNamePlaceholder':'Nome do respons\u00E1vel...', 'pm.addOwner':'+ Adicionar', 'pm.noPlatform':'N\u00E3o especificada', 't.postUpdated':'\u2705 Post atualizado!',
    'calExport.title':'Exportar Calend\u00E1rio', 'calExport.subtitle':'Escolha o que incluir no relat\u00F3rio',
    'calExport.clients':'Clientes', 'calExport.statuses':'Status', 'calExport.noClients':'Nenhum cliente cadastrado',
    'calExport.empty':'\u26A0\uFE0F Nenhum post encontrado com esses filtros', 'calExport.sheetName':'Calend\u00E1rio',
    'calExport.colDate':'Data', 'calExport.colClient':'Cliente', 'calExport.colType':'Tipo', 'calExport.colPlatform':'Plataforma',
    'calExport.colStatus':'Status', 'calExport.colTime':'Hor\u00E1rio', 'calExport.colNote':'Anota\u00E7\u00E3o',
    'proj.showCompleted':'Conclu\u00EDdos', 'proj.syncCalendar':'M\u00EAs do Calend\u00E1rio',
    'proj.syncCalendarTitle':'Mostrar apenas projetos do m\u00EAs selecionado no Calend\u00E1rio',
    'pm.startDate':'Data de In\u00EDcio', 't.deadlineBeforeStart':'\u26A0\uFE0F O prazo final n\u00E3o pode ser antes da data de in\u00EDcio',
    'heatmap.label':'Mapa de Calor', 'heatmap.tooltip':'Colore cada dia do calend\u00E1rio pela quantidade de posts agendados: quanto mais vermelho, mais posts naquele dia.',
    'heatmap.legendTitle':'A cor mostra quantos posts tem cada dia:', 'heatmap.legendLow':'poucos', 'heatmap.legendHigh':'muitos',
    'charts.label':'An\u00E1lise', 'charts.tooltip':'Veja gr\u00E1ficos com a distribui\u00E7\u00E3o dos seus posts por tipo, status, plataforma e mais.',
    'nav.tasks':'Tarefas',
    'tasks.searchPlaceholder':'Buscar tarefa...', 'tasks.showDoneTitle':'Mostrar tarefas conclu\u00EDdas', 'tasks.showDone':'Conclu\u00EDdas',
    'tasks.newTask':'Nova Tarefa', 'tasks.emptyTitle':'Nenhuma tarefa ainda', 'tasks.emptySub':'Crie sua primeira tarefa e organize o que precisa ser feito, dia ap\u00F3s dia.',
    'tasks.titlePlaceholder':'Nome da tarefa...', 'tasks.priority':'Prioridade', 'tasks.dueDate':'Data (opcional)', 'tasks.desc':'Descri\u00E7\u00E3o',
    'tasks.descPlaceholder':'Detalhes da tarefa...', 'tasks.checklistPlaceholder':'Adicionar item...', 'tasks.checklistEmpty':'Nenhum item adicionado ainda',
    'tasks.delete':'Excluir Tarefa', 'tasks.save':'Salvar Tarefa', 'tasks.markDone':'Marcar como conclu\u00EDda',
    'tasks.colPending':'Pendentes', 'tasks.colDone':'Conclu\u00EDdas', 'tasks.colEmpty':'Nenhuma tarefa aqui',
    'tasks.enterTitle':'\u26A0\uFE0F Digite o nome da tarefa', 'tasks.saving':'Salvando...', 'tasks.updated':'\u2705 Tarefa atualizada!', 'tasks.created':'\u2705 Tarefa criada!',
    'tasks.confirmDelete':'Excluir \"{title}\"?', 'tasks.deleted':'\u2705 Tarefa exclu\u00EDda',
    'notif.assignedTitle':'Voc\u00EA foi designado(a)', 'notif.assignedBody':'{name} te atribuiu ao projeto \"{project}\"', 'notif.viewProject':'Ver projeto', 'profile.theme':'\uD83C\uDFA8 Tema', 'profile.themeDark':'Escuro', 'profile.themeLight':'Claro', 'profile.themeSystem':'Sistema', 'support.title':'Fale com o Suporte', 'support.subtitle':'Estamos por aqui para ajudar', 'support.email':'E-mail', 'toast.created':'\u2705 "{name}" criado!',
    'ws.settings':'Workspace', 'ws.editWorkspace':'Editar Workspace', 'ws.currency':'Moeda',
    'pm.client':'Cliente', 'pm.status':'Status', 'pm.deadline':'Prazo de Entrega', 'pm.priority':'Prioridade',
    'pm.services':'Servico(s)', 'pm.desc':'Descri\u00E7\u00E3o / Briefing', 'pm.owners':'Respons\u00E1veis',
    'pm.notes':'Anota\u00E7\u00F5es internas', 'pm.payment':'Pagamento', 'pm.totalValue':'Valor total', 'pm.paymentMode':'Forma',
    'pm.checklist':'Checklist de Entregas', 'pm.save':'Salvar Projeto', 'pm.delete':'Excluir', 'pm.projectName':'Nome do projeto...',
    'settings.title':'Configura\u00E7\u00F5es', 'settings.subtitle':'Plataformas e status de posts',
    'settings.platforms':'Plataformas', 'settings.addPlatform':'+ Adicionar Plataforma',
    'settings.postStatus':'Status de Posts', 'settings.addStatus':'+ Adicionar Status',
    'ws.members':'Membros e convites', 'ws.create':'Criar Workspace', 'ws.createSubtitle':'Calend\u00E1rio compartilhado com a equipe',
    't.allRead':'\u2705 Todas marcadas como lidas', 't.welcome':'\uD83C\uDF89 Bem-vindo ao NOOMA Calendar!',
    't.appInstalled':'\u2705 App instalado!', 't.wsCreated':'\u2705 Workspace "{name}" criado!',
    't.inviteInvalid':'\u274C Convite inv\u00E1lido ou expirado.', 't.alreadyMember':'\u2705 Voc\u00EA j\u00E1 \u00E9 membro deste workspace!',
    't.userApproved':'\u2705 {name} aprovado!', 't.rejected':'\u274C Rejeitado', 't.roleUpdated':'\u2705 Papel atualizado',
    't.memberRemoved':'\uD83D\uDDD1 {name} removido', 't.youLeft':'\uD83D\uDC4B Voc\u00EA saiu', 't.wsDeleted':'\uD83D\uDDD1 Workspace deletado',
    't.newLink':'\uD83D\uDD04 Novo link gerado!', 't.postRemoved':'\uD83D\uDDD1 Postagem removida', 't.noteUpdated':'\u2705 Anota\u00E7\u00E3o atualizada!',
    't.postAdded':'\u2705 Postagem adicionada!', 't.clientUpdated':'\u2705 Cliente atualizado!', 't.clientRemoved':'\uD83D\uDDD1 Cliente removido',
    't.typeUpdated':'\u2705 Tipo atualizado!', 't.typeRemoved':'\uD83D\uDDD1 Tipo removido', 't.platformUpdated':'\u2705 Plataforma atualizada!',
    't.platformRemoved':'\uD83D\uDDD1 Plataforma removida', 't.statusUpdated':'\u2705 Status atualizado!', 't.statusRemoved':'\uD83D\uDDD1 Status removido',
    't.linkCopied':'\uD83D\uDCCB Link copiado!', 't.enterWsName':'\u26A0\uFE0F Digite o nome do workspace', 't.wsUpdated':'\u2705 Workspace atualizado!',
    't.imgTooBig2':'\u26A0\uFE0F Imagem at\u00E9 2MB', 't.imgTooBig500':'\u26A0\uFE0F Imagem muito grande (max 500KB)', 't.imgProcessError':'\u26A0\uFE0F N\u00E3o foi poss\u00EDvel processar essa imagem. Tente uma foto em JPG ou PNG.',
    't.resetSent':'\uD83D\uDCE7 E-mail de redefini\u00E7\u00E3o enviado!', 't.accountCreated':'\u2705 Conta criada! Bem-vindo, {name}!',
    't.signupComplete':'\u2705 Cadastro completo! Bem-vindo!', 't.addedToCalendar':'\uD83D\uDCC5 Adicionado ao calend\u00E1rio: {label}',
    't.enterStatusName':'\u26A0\uFE0F Digite o nome do status', 't.statusCreated':'\u2705 Status "{name}" criado!',
    't.enterParcelName':'\u26A0\uFE0F Digite o nome da parcela', 't.enterProjectName':'\u26A0\uFE0F Digite o nome do projeto',
    't.projectDeleted':'\uD83D\uDDD1 Projeto exclu\u00EDdo', 't.statusesSaved':'\u2705 Status salvos!', 't.photoUpdated':'\uD83D\uDCF7 Foto atualizada!',
    't.passwordUpdated':'\uD83D\uDD11 Senha atualizada!', 't.profileUpdated':'\u2705 Perfil atualizado!',
  },
  en: {
    'nav.calendar':'Calendar', 'nav.projects':'Projects',
    'sidebar.clients':'Clients', 'sidebar.contentTypes':'Content Types', 'sidebar.filters':'Filters',
    'sidebar.manageClients':'Manage Clients', 'sidebar.manageTypes':'Manage Types',
    'sidebar.clearFilters':'Clear Filters', 'sidebar.client':'Client', 'sidebar.contentType':'Content Type',
    'sidebar.platform':'Platform', 'sidebar.allClients':'All clients', 'sidebar.allTypes':'All types',
    'sidebar.allPlatforms':'All platforms',
    'view.month':'Month', 'view.week':'Week', 'view.list':'List',
    'login.signin':'Sign in', 'login.signup':'Create account', 'login.email':'Email', 'login.password':'Password',
    'login.forgot':'Forgot my password', 'login.or':'or', 'login.google':'Sign in with Google', 'login.apple':'Sign in with Apple', 'login.terms':'By creating an account, you agree to our terms of use.',
    'login.fullname':'Full name', 'login.phone':'Phone with country code', 'login.createAccount':'Create my account',
    'login.fullnamePh':'Full name *', 'login.phonePh':'Phone number *', 'login.emailPh':'Email *',
    'login.passwordPh':'Password (min. 6 characters) *', 'login.orSignupWith':'or sign up with', 'login.continueGoogle':'Continue with Google',
    'profile.title':'My Profile', 'profile.subtitle':'Customize your account', 'profile.name':'Full name',
    'profile.phone':'Phone', 'profile.email':'Email', 'profile.save':'Save changes', 'profile.logout':'Log out',
    'proj.allProjects':'All Projects', 'proj.newProject':'New Project', 'proj.search':'Search project...',
    'proj.sortDeadline':'Deadline', 'proj.sortUrgency':'Urgency', 'proj.sortClient':'Client A-Z', 'proj.sortValue':'Value', 'proj.searchPh':'\uD83D\uDD0D Search project...',
    'common.save':'Save', 'common.cancel':'Cancel', 'common.delete':'Delete', 'common.create':'Create',
    'common.close':'Close', 'common.loading':'Loading...', 'toast.error':'\u274C Error: {msg}', 'toast.enterName':'\u26A0\uFE0F Enter the name',
    'auth.userNotFound':'User not found.', 'auth.wrongPassword':'Incorrect password.',
    'auth.invalidCredential':'Invalid email or password.', 'auth.invalidEmail':'Invalid email.',
    'auth.tooManyRequests':'Too many attempts. Try again later.', 'auth.emailInUse':'This email is already registered.',
    'auth.weakPassword':'Password too weak (min. 6 characters).', 'auth.wrongPasswordCurrent':'Current password is incorrect.',
    'auth.requiresRecentLogin':'Please sign in again to change your password.', 'pwa.subtitle':'Quick access', 'pwa.install':'Install',
    'analytics.title':'Analytics', 'analytics.subtitle':'Administrator-only view',
    'charts.title':'Content Analysis', 'charts.subtitle':'Overview of all posts',
    'report.title':'Completed Projects Report', 'report.sheetName':'Completed Projects',
    'report.client':'Client', 'report.project':'Project', 'report.services':'Services', 'report.owners':'Owners',
    'report.deadline':'Deadline', 'report.total':'Total Value', 'report.paid':'Paid', 'report.pending':'Pending',
    'report.checklist':'Deliverables', 'report.completedAt':'Completed On', 'report.empty':'\u26A0\uFE0F No completed projects to export',
    'report.exported':'\u2705 Report exported!', 'report.libsLoadError':'\u26A0\uFE0F Error loading export libraries. Check your connection and try again.', 'report.projectsCount':'projects', 'report.status':'Status',
    'export.title':'Export Report', 'export.subtitle':'Choose which projects to include',
    'export.presetCompleted':'Completed Only', 'export.presetAll':'All Statuses', 'export.presetNone':'Clear',
    'export.selectStatuses':'Statuses to include', 'export.excel':'Excel (.xlsx)', 'export.pdf':'PDF', 'export.word':'Word (.doc)',
    'profile.replayTutorial':'Watch tutorial again', 'profile.contactSupport':'Contact support',
    'hdr.language':'Language', 'hdr.search':'Search', 'hdr.settings':'Settings', 'hdr.wsSettings':'Workspace Settings', 'hdr.analytics':'Analytics',
    'common.close':'Close', 'hdr.sidebar':'Menu', 'hdr.settingsFull':'Settings (Platforms + Status)', 'hdr.pendingRequests':'Pending join requests',
    'hdr.notifications':'Notifications', 'hdr.moreOptions':'More options',
    'fab.manageClients':'Manage Clients', 'fab.manageTypes':'Manage Content Types', 'proj.configStatus':'Configure Status', 'proj.colsByStatus':'Columns by Status', 'proj.colsByOwner':'Columns by Owner',
    'pm.noOwners':'No owner added yet', 'pm.workspaceMember':'Workspace member', 'pm.customOwner':'Custom owner',
    'pm.noWorkspaceMembers':'You don\'t have other members in this workspace yet', 'pm.pickWorkspaceMember':'Pick from workspace',
    'pm.ownerNamePlaceholder':'Owner name...', 'pm.addOwner':'+ Add', 'pm.noPlatform':'Not specified', 't.postUpdated':'\u2705 Post updated!',
    'calExport.title':'Export Calendar', 'calExport.subtitle':'Choose what to include in the report',
    'calExport.clients':'Clients', 'calExport.statuses':'Status', 'calExport.noClients':'No clients registered',
    'calExport.empty':'\u26A0\uFE0F No posts found with these filters', 'calExport.sheetName':'Calendar',
    'calExport.colDate':'Date', 'calExport.colClient':'Client', 'calExport.colType':'Type', 'calExport.colPlatform':'Platform',
    'calExport.colStatus':'Status', 'calExport.colTime':'Time', 'calExport.colNote':'Note',
    'proj.showCompleted':'Completed', 'proj.syncCalendar':'Calendar Month',
    'proj.syncCalendarTitle':'Show only projects from the month selected in the Calendar',
    'pm.startDate':'Start Date', 't.deadlineBeforeStart':'\u26A0\uFE0F Deadline can\'t be before the start date',
    'heatmap.label':'Heatmap', 'heatmap.tooltip':'Colors each calendar day by how many posts are scheduled: the redder it is, the more posts that day has.',
    'heatmap.legendTitle':'Color shows how many posts each day has:', 'heatmap.legendLow':'few', 'heatmap.legendHigh':'many',
    'charts.label':'Analysis', 'charts.tooltip':'See charts with the breakdown of your posts by type, status, platform and more.',
    'nav.tasks':'Tasks',
    'tasks.searchPlaceholder':'Search task...', 'tasks.showDoneTitle':'Show completed tasks', 'tasks.showDone':'Completed',
    'tasks.newTask':'New Task', 'tasks.emptyTitle':'No tasks yet', 'tasks.emptySub':'Create your first task and organize what needs to get done, day after day.',
    'tasks.titlePlaceholder':'Task name...', 'tasks.priority':'Priority', 'tasks.dueDate':'Date (optional)', 'tasks.desc':'Description',
    'tasks.descPlaceholder':'Task details...', 'tasks.checklistPlaceholder':'Add item...', 'tasks.checklistEmpty':'No items added yet',
    'tasks.delete':'Delete Task', 'tasks.save':'Save Task', 'tasks.markDone':'Mark as done',
    'tasks.colPending':'Pending', 'tasks.colDone':'Completed', 'tasks.colEmpty':'No tasks here',
    'tasks.enterTitle':'\u26A0\uFE0F Enter the task name', 'tasks.saving':'Saving...', 'tasks.updated':'\u2705 Task updated!', 'tasks.created':'\u2705 Task created!',
    'tasks.confirmDelete':'Delete \"{title}\"?', 'tasks.deleted':'\u2705 Task deleted',
    'notif.assignedTitle':'You\'ve been assigned', 'notif.assignedBody':'{name} assigned you to the project \"{project}\"', 'notif.viewProject':'View project', 'profile.theme':'\uD83C\uDFA8 Theme', 'profile.themeDark':'Dark', 'profile.themeLight':'Light', 'profile.themeSystem':'System', 'support.title':'Contact Support', 'support.subtitle':'We\'re here to help', 'support.email':'Email', 'toast.created':'\u2705 "{name}" created!',
    'ws.settings':'Workspace', 'ws.editWorkspace':'Edit Workspace', 'ws.currency':'Currency',
    'pm.client':'Client', 'pm.status':'Status', 'pm.deadline':'Deadline', 'pm.priority':'Priority',
    'pm.services':'Service(s)', 'pm.desc':'Description / Brief', 'pm.owners':'Owners',
    'pm.notes':'Internal notes', 'pm.payment':'Payment', 'pm.totalValue':'Total value', 'pm.paymentMode':'Method',
    'pm.checklist':'Deliverables Checklist', 'pm.save':'Save Project', 'pm.delete':'Delete', 'pm.projectName':'Project name...',
    'settings.title':'Settings', 'settings.subtitle':'Platforms and post status',
    'settings.platforms':'Platforms', 'settings.addPlatform':'+ Add Platform',
    'settings.postStatus':'Post Status', 'settings.addStatus':'+ Add Status',
    'ws.members':'Members and invites', 'ws.create':'Create Workspace', 'ws.createSubtitle':'Calendar shared with your team',
    't.allRead':'\u2705 All marked as read', 't.welcome':'\uD83C\uDF89 Welcome to NOOMA Calendar!',
    't.appInstalled':'\u2705 App installed!', 't.wsCreated':'\u2705 Workspace "{name}" created!',
    't.inviteInvalid':'\u274C Invalid or expired invite.', 't.alreadyMember':'\u2705 You are already a member of this workspace!',
    't.userApproved':'\u2705 {name} approved!', 't.rejected':'\u274C Rejected', 't.roleUpdated':'\u2705 Role updated',
    't.memberRemoved':'\uD83D\uDDD1 {name} removed', 't.youLeft':'\uD83D\uDC4B You left', 't.wsDeleted':'\uD83D\uDDD1 Workspace deleted',
    't.newLink':'\uD83D\uDD04 New link generated!', 't.postRemoved':'\uD83D\uDDD1 Post removed', 't.noteUpdated':'\u2705 Note updated!',
    't.postAdded':'\u2705 Post added!', 't.clientUpdated':'\u2705 Client updated!', 't.clientRemoved':'\uD83D\uDDD1 Client removed',
    't.typeUpdated':'\u2705 Type updated!', 't.typeRemoved':'\uD83D\uDDD1 Type removed', 't.platformUpdated':'\u2705 Platform updated!',
    't.platformRemoved':'\uD83D\uDDD1 Platform removed', 't.statusUpdated':'\u2705 Status updated!', 't.statusRemoved':'\uD83D\uDDD1 Status removed',
    't.linkCopied':'\uD83D\uDCCB Link copied!', 't.enterWsName':'\u26A0\uFE0F Enter the workspace name', 't.wsUpdated':'\u2705 Workspace updated!',
    't.imgTooBig2':'\u26A0\uFE0F Image up to 2MB', 't.imgTooBig500':'\u26A0\uFE0F Image too large (max 500KB)', 't.imgProcessError':'\u26A0\uFE0F Could not process this image. Try a JPG or PNG photo.',
    't.resetSent':'\uD83D\uDCE7 Reset email sent!', 't.accountCreated':'\u2705 Account created! Welcome, {name}!',
    't.signupComplete':'\u2705 Signup complete! Welcome!', 't.addedToCalendar':'\uD83D\uDCC5 Added to calendar: {label}',
    't.enterStatusName':'\u26A0\uFE0F Enter the status name', 't.statusCreated':'\u2705 Status "{name}" created!',
    't.enterParcelName':'\u26A0\uFE0F Enter the installment name', 't.enterProjectName':'\u26A0\uFE0F Enter the project name',
    't.projectDeleted':'\uD83D\uDDD1 Project deleted', 't.statusesSaved':'\u2705 Statuses saved!', 't.photoUpdated':'\uD83D\uDCF7 Photo updated!',
    't.passwordUpdated':'\uD83D\uDD11 Password updated!', 't.profileUpdated':'\u2705 Profile updated!',
  },
  es: {
    'nav.calendar':'Calendario', 'nav.projects':'Proyectos',
    'sidebar.clients':'Clientes', 'sidebar.contentTypes':'Tipos de Contenido', 'sidebar.filters':'Filtros',
    'sidebar.manageClients':'Gestionar Clientes', 'sidebar.manageTypes':'Gestionar Tipos',
    'sidebar.clearFilters':'Limpiar Filtros', 'sidebar.client':'Cliente', 'sidebar.contentType':'Tipo de Contenido',
    'sidebar.platform':'Plataforma', 'sidebar.allClients':'Todos los clientes', 'sidebar.allTypes':'Todos los tipos',
    'sidebar.allPlatforms':'Todas las plataformas',
    'view.month':'Mes', 'view.week':'Sem.', 'view.list':'Lista',
    'login.signin':'Entrar', 'login.signup':'Crear cuenta', 'login.email':'Correo', 'login.password':'Contrasena',
    'login.forgot':'Olvide mi contrasena', 'login.or':'o', 'login.google':'Entrar con Google', 'login.apple':'Entrar con Apple', 'login.terms':'Al crear una cuenta, aceptas nuestros terminos de uso.',
    'login.fullname':'Nombre completo', 'login.phone':'Celular con codigo', 'login.createAccount':'Crear mi cuenta',
    'login.fullnamePh':'Nombre completo *', 'login.phonePh':'Celular con codigo *', 'login.emailPh':'Correo *',
    'login.passwordPh':'Contrasena (min. 6 caracteres) *', 'login.orSignupWith':'o registrate con', 'login.continueGoogle':'Continuar con Google',
    'profile.title':'Mi Perfil', 'profile.subtitle':'Personaliza tu cuenta', 'profile.name':'Nombre completo',
    'profile.phone':'Celular', 'profile.email':'Correo', 'profile.save':'Guardar cambios', 'profile.logout':'Salir',
    'proj.allProjects':'Todos los Proyectos', 'proj.newProject':'Nuevo Proyecto', 'proj.search':'Buscar proyecto...',
    'proj.sortDeadline':'Plazo', 'proj.sortUrgency':'Urgencia', 'proj.sortClient':'Cliente A-Z', 'proj.sortValue':'Valor', 'proj.searchPh':'\uD83D\uDD0D Buscar proyecto...',
    'common.save':'Guardar', 'common.cancel':'Cancelar', 'common.delete':'Eliminar', 'common.create':'Crear',
    'common.close':'Cerrar', 'common.loading':'Cargando...', 'toast.error':'\u274C Error: {msg}', 'toast.enterName':'\u26A0\uFE0F Ingresa el nombre',
    'auth.userNotFound':'Usuario no encontrado.', 'auth.wrongPassword':'Contrasena incorrecta.',
    'auth.invalidCredential':'Correo o contrasena invalidos.', 'auth.invalidEmail':'Correo invalido.',
    'auth.tooManyRequests':'Demasiados intentos. Intenta mas tarde.', 'auth.emailInUse':'Este correo ya esta registrado.',
    'auth.weakPassword':'Contrasena muy debil (min. 6 caracteres).', 'auth.wrongPasswordCurrent':'Contrasena actual incorrecta.',
    'auth.requiresRecentLogin':'Inicia sesion de nuevo para cambiar tu contrasena.', 'pwa.subtitle':'Acceso mas rapido', 'pwa.install':'Instalar',
    'analytics.title':'Analytics', 'analytics.subtitle':'Vista exclusiva del administrador',
    'charts.title':'Analisis de Contenido', 'charts.subtitle':'Vision general de todas las publicaciones',
    'report.title':'Informe de Proyectos Completados', 'report.sheetName':'Proyectos Completados',
    'report.client':'Cliente', 'report.project':'Proyecto', 'report.services':'Servicios', 'report.owners':'Responsables',
    'report.deadline':'Plazo', 'report.total':'Valor Total', 'report.paid':'Recibido', 'report.pending':'Pendiente',
    'report.checklist':'Entregas', 'report.completedAt':'Completado el', 'report.empty':'\u26A0\uFE0F No hay proyectos completados para exportar',
    'report.exported':'\u2705 Informe exportado!', 'report.libsLoadError':'\u26A0\uFE0F Error al cargar las bibliotecas de exportaci\u00F3n. Verifica tu conexi\u00F3n e intenta de nuevo.', 'report.projectsCount':'proyectos', 'report.status':'Status',
    'export.title':'Exportar Informe', 'export.subtitle':'Elige que proyectos incluir',
    'export.presetCompleted':'Solo Completados', 'export.presetAll':'Todos los Status', 'export.presetNone':'Limpiar',
    'profile.replayTutorial':'Ver tutorial de nuevo', 'profile.contactSupport':'Hablar con soporte',
    'hdr.language':'Idioma', 'hdr.search':'Buscar', 'hdr.settings':'Configuraci\u00F3n', 'hdr.wsSettings':'Config. Workspace', 'hdr.analytics':'Analytics',
    'common.close':'Cerrar', 'hdr.sidebar':'Men\u00FA', 'hdr.settingsFull':'Configuraci\u00F3n (Plataformas + Status)', 'hdr.pendingRequests':'Solicitudes de ingreso pendientes',
    'hdr.notifications':'Notificaciones', 'hdr.moreOptions':'M\u00E1s opciones',
    'fab.manageClients':'Gestionar Clientes', 'fab.manageTypes':'Gestionar Tipos de Contenido', 'proj.configStatus':'Configurar Status', 'proj.colsByStatus':'Columnas por Status', 'proj.colsByOwner':'Columnas por Responsable',
    'pm.noOwners':'Ning\u00FAn responsable agregado', 'pm.workspaceMember':'Miembro del workspace', 'pm.customOwner':'Responsable personalizado',
    'pm.noWorkspaceMembers':'A\u00FAn no tienes otros miembros en este workspace', 'pm.pickWorkspaceMember':'Elegir del workspace',
    'pm.ownerNamePlaceholder':'Nombre del responsable...', 'pm.addOwner':'+ Agregar', 'pm.noPlatform':'No especificada', 't.postUpdated':'\u2705 \u00A1Publicaci\u00F3n actualizada!',
    'calExport.title':'Exportar Calendario', 'calExport.subtitle':'Elige qu\u00E9 incluir en el informe',
    'calExport.clients':'Clientes', 'calExport.statuses':'Status', 'calExport.noClients':'No hay clientes registrados',
    'calExport.empty':'\u26A0\uFE0F No se encontraron publicaciones con estos filtros', 'calExport.sheetName':'Calendario',
    'calExport.colDate':'Fecha', 'calExport.colClient':'Cliente', 'calExport.colType':'Tipo', 'calExport.colPlatform':'Plataforma',
    'calExport.colStatus':'Status', 'calExport.colTime':'Hora', 'calExport.colNote':'Nota',
    'proj.showCompleted':'Completados', 'proj.syncCalendar':'Mes del Calendario',
    'proj.syncCalendarTitle':'Mostrar solo proyectos del mes seleccionado en el Calendario',
    'pm.startDate':'Fecha de Inicio', 't.deadlineBeforeStart':'\u26A0\uFE0F El plazo final no puede ser antes de la fecha de inicio',
    'heatmap.label':'Mapa de Calor', 'heatmap.tooltip':'Colorea cada d\u00EDa del calendario seg\u00FAn la cantidad de publicaciones programadas: cuanto m\u00E1s rojo, m\u00E1s publicaciones tiene ese d\u00EDa.',
    'heatmap.legendTitle':'El color muestra cu\u00E1ntas publicaciones tiene cada d\u00EDa:', 'heatmap.legendLow':'pocas', 'heatmap.legendHigh':'muchas',
    'charts.label':'An\u00E1lisis', 'charts.tooltip':'Mira gr\u00E1ficos con la distribuci\u00F3n de tus publicaciones por tipo, status, plataforma y m\u00E1s.',
    'nav.tasks':'Tareas',
    'tasks.searchPlaceholder':'Buscar tarea...', 'tasks.showDoneTitle':'Mostrar tareas completadas', 'tasks.showDone':'Completadas',
    'tasks.newTask':'Nueva Tarea', 'tasks.emptyTitle':'A\u00FAn no hay tareas', 'tasks.emptySub':'Crea tu primera tarea y organiza lo que necesitas hacer, d\u00EDa tras d\u00EDa.',
    'tasks.titlePlaceholder':'Nombre de la tarea...', 'tasks.priority':'Prioridad', 'tasks.dueDate':'Fecha (opcional)', 'tasks.desc':'Descripci\u00F3n',
    'tasks.descPlaceholder':'Detalles de la tarea...', 'tasks.checklistPlaceholder':'Agregar elemento...', 'tasks.checklistEmpty':'Ning\u00FAn elemento agregado a\u00FAn',
    'tasks.delete':'Eliminar Tarea', 'tasks.save':'Guardar Tarea', 'tasks.markDone':'Marcar como completada',
    'tasks.colPending':'Pendientes', 'tasks.colDone':'Completadas', 'tasks.colEmpty':'Ninguna tarea aqu\u00ED',
    'tasks.enterTitle':'\u26A0\uFE0F Escribe el nombre de la tarea', 'tasks.saving':'Guardando...', 'tasks.updated':'\u2705 \u00A1Tarea actualizada!', 'tasks.created':'\u2705 \u00A1Tarea creada!',
    'tasks.confirmDelete':'\u00BFEliminar \"{title}\"?', 'tasks.deleted':'\u2705 Tarea eliminada',
    'notif.assignedTitle':'Fuiste asignado(a)', 'notif.assignedBody':'{name} te asign\u00F3 al proyecto \"{project}\"', 'notif.viewProject':'Ver proyecto', 'profile.theme':'\uD83C\uDFA8 Tema', 'profile.themeDark':'Oscuro', 'profile.themeLight':'Claro', 'profile.themeSystem':'Sistema', 'support.title':'Contactar con Soporte', 'support.subtitle':'Estamos aqui para ayudar', 'support.email':'Correo',
    'export.selectStatuses':'Status a incluir', 'export.excel':'Excel (.xlsx)', 'export.pdf':'PDF', 'export.word':'Word (.doc)', 'toast.created':'\u2705 "{name}" creado!',
    'ws.settings':'Workspace', 'ws.editWorkspace':'Editar Workspace', 'ws.currency':'Moneda',
    'pm.client':'Cliente', 'pm.status':'Status', 'pm.deadline':'Plazo de Entrega', 'pm.priority':'Prioridad',
    'pm.services':'Servicio(s)', 'pm.desc':'Descripcion / Brief', 'pm.owners':'Responsables',
    'pm.notes':'Notas internas', 'pm.payment':'Pago', 'pm.totalValue':'Valor total', 'pm.paymentMode':'Forma',
    'pm.checklist':'Checklist de Entregas', 'pm.save':'Guardar Proyecto', 'pm.delete':'Eliminar', 'pm.projectName':'Nombre del proyecto...',
    'settings.title':'Configuracion', 'settings.subtitle':'Plataformas y status de publicaciones',
    'settings.platforms':'Plataformas', 'settings.addPlatform':'+ Anadir Plataforma',
    'settings.postStatus':'Status de Publicaciones', 'settings.addStatus':'+ Anadir Status',
    'ws.members':'Miembros e invitaciones', 'ws.create':'Crear Workspace', 'ws.createSubtitle':'Calendario compartido con el equipo',
    't.allRead':'\u2705 Todas marcadas como leidas', 't.welcome':'\uD83C\uDF89 Bienvenido a NOOMA Calendar!',
    't.appInstalled':'\u2705 App instalada!', 't.wsCreated':'\u2705 Workspace "{name}" creado!',
    't.inviteInvalid':'\u274C Invitacion invalida o expirada.', 't.alreadyMember':'\u2705 Ya eres miembro de este workspace!',
    't.userApproved':'\u2705 {name} aprobado!', 't.rejected':'\u274C Rechazado', 't.roleUpdated':'\u2705 Rol actualizado',
    't.memberRemoved':'\uD83D\uDDD1 {name} eliminado', 't.youLeft':'\uD83D\uDC4B Saliste', 't.wsDeleted':'\uD83D\uDDD1 Workspace eliminado',
    't.newLink':'\uD83D\uDD04 Nuevo enlace generado!', 't.postRemoved':'\uD83D\uDDD1 Publicacion eliminada', 't.noteUpdated':'\u2705 Nota actualizada!',
    't.postAdded':'\u2705 Publicacion anadida!', 't.clientUpdated':'\u2705 Cliente actualizado!', 't.clientRemoved':'\uD83D\uDDD1 Cliente eliminado',
    't.typeUpdated':'\u2705 Tipo actualizado!', 't.typeRemoved':'\uD83D\uDDD1 Tipo eliminado', 't.platformUpdated':'\u2705 Plataforma actualizada!',
    't.platformRemoved':'\uD83D\uDDD1 Plataforma eliminada', 't.statusUpdated':'\u2705 Status actualizado!', 't.statusRemoved':'\uD83D\uDDD1 Status eliminado',
    't.linkCopied':'\uD83D\uDCCB Enlace copiado!', 't.enterWsName':'\u26A0\uFE0F Ingresa el nombre del workspace', 't.wsUpdated':'\u2705 Workspace actualizado!',
    't.imgTooBig2':'\u26A0\uFE0F Imagen hasta 2MB', 't.imgTooBig500':'\u26A0\uFE0F Imagen muy grande (max 500KB)', 't.imgProcessError':'\u26A0\uFE0F No se pudo procesar esta imagen. Prueba con una foto en JPG o PNG.',
    't.resetSent':'\uD83D\uDCE7 Correo de restablecimiento enviado!', 't.accountCreated':'\u2705 Cuenta creada! Bienvenido, {name}!',
    't.signupComplete':'\u2705 Registro completo! Bienvenido!', 't.addedToCalendar':'\uD83D\uDCC5 Anadido al calendario: {label}',
    't.enterStatusName':'\u26A0\uFE0F Ingresa el nombre del status', 't.statusCreated':'\u2705 Status "{name}" creado!',
    't.enterParcelName':'\u26A0\uFE0F Ingresa el nombre de la cuota', 't.enterProjectName':'\u26A0\uFE0F Ingresa el nombre del proyecto',
    't.projectDeleted':'\uD83D\uDDD1 Proyecto eliminado', 't.statusesSaved':'\u2705 Status guardados!', 't.photoUpdated':'\uD83D\uDCF7 Foto actualizada!',
    't.passwordUpdated':'\uD83D\uDD11 Contrasena actualizada!', 't.profileUpdated':'\u2705 Perfil actualizado!',
  },
};

const SUPPORTED_LANGS=['pt','en','es'];
function detectDefaultLang(){
  const saved=localStorage.getItem('nooma_lang');
  if(saved&&SUPPORTED_LANGS.includes(saved))return saved;
  const nav=(navigator.language||'pt').slice(0,2).toLowerCase();
  return SUPPORTED_LANGS.includes(nav)?nav:'pt';
}
let currentLang=detectDefaultLang();

function t(key,vars){
  let str=(I18N[currentLang]&&I18N[currentLang][key])||(I18N.pt[key])||key;
  if(vars)Object.keys(vars).forEach(k=>{str=str.replace(`{${k}}`,vars[k]);});
  return str;
}

function setLang(lang){
  if(!SUPPORTED_LANGS.includes(lang))return;
  currentLang=lang;
  localStorage.setItem('nooma_lang',lang);
  rebuildLocaleArrays();
  NOTIF_MESSAGES=NOTIF_MESSAGES_ALL[lang]||NOTIF_MESSAGES_ALL.pt;
  WIZARD_STEPS=WIZARD_STEPS_ALL[lang]||WIZARD_STEPS_ALL.pt;
  applyI18n();
  renderAll();
  updateLangButtonsActive();
  updateLangHdrActive();
}

function getLocale(){
  return {pt:'pt-BR',en:'en-US',es:'es-ES'}[currentLang]||'pt-BR';
}

// Aplica traducoes em todos os elementos marcados com data-i18n
function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    el.textContent=t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    el.placeholder=t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el=>{
    el.title=t(el.dataset.i18nTitle);
    el.setAttribute('aria-label',t(el.dataset.i18nTitle));
  });
  document.documentElement.lang=currentLang;
}

// ---- Datas com Intl (substitui os arrays fixos MONTHS/DAYS em PT) ----
function localMonthName(monthIdx1based){ // 1-12
  const d=new Date(2024,monthIdx1based-1,1);
  return new Intl.DateTimeFormat(getLocale(),{month:'long'}).format(d);
}
function localDayName(dowIdx,short=false){ // 0=domingo..6=sabado
  const d=new Date(2024,0,7+dowIdx); // 7 jan 2024 = domingo
  return new Intl.DateTimeFormat(getLocale(),{weekday:short?'short':'long'}).format(d);
}

// ---- Moeda (substitui "R$" fixo) ----
function getCurrency(){
  return state.currentWorkspace?.currency||'BRL';
}
function fmtMoney(value){
  try{
    return new Intl.NumberFormat(getLocale(),{style:'currency',currency:getCurrency(),minimumFractionDigits:2}).format(value||0);
  }catch(e){
    return `R$ ${(value||0).toFixed(2)}`;
  }
}
const CURRENCY_OPTIONS=[
  {code:'BRL',label:'R$ - Real (Brasil)'},
  {code:'USD',label:'$ - US Dollar'},
  {code:'EUR',label:'\u20AC - Euro'},
  {code:'GBP',label:'\u00A3 - British Pound'},
  {code:'MXN',label:'$ - Peso Mexicano'},
  {code:'ARS',label:'$ - Peso Argentino'},
  {code:'COP',label:'$ - Peso Colombiano'},
];

// Reconstroi MONTHS/DAYS de acordo com o idioma atual (usa Intl, capitaliza a 1a letra)
function capFirst(s){return s?s.charAt(0).toUpperCase()+s.slice(1):s;}
let MONTHS=[],DAYS=[];
function rebuildLocaleArrays(){
  MONTHS=Array.from({length:12},(_,i)=>capFirst(localMonthName(i+1)));
  DAYS=Array.from({length:7},(_,i)=>capFirst(localDayName(i)));
}
rebuildLocaleArrays();

// ---- Language switcher (login + profile) ----
function updateLangButtonsActive(){
  document.querySelectorAll('.lang-flag-btn').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.lang===currentLang);
  });
}
document.addEventListener('click',e=>{
  const btn=e.target.closest('.lang-flag-btn');
  if(!btn)return;
  setLang(btn.dataset.lang);
});
// Botao de globo no header
document.getElementById('btnLangHdr')?.addEventListener('click',e=>{
  e.stopPropagation();
  document.getElementById('langHdrMenu')?.classList.toggle('open');
});
document.querySelectorAll('.lang-hdr-opt').forEach(opt=>{
  opt.addEventListener('click',()=>{
    setLang(opt.dataset.lang);
    document.getElementById('langHdrMenu')?.classList.remove('open');
  });
});
document.addEventListener('click',e=>{
  if(!e.target.closest('.lang-hdr-wrap'))document.getElementById('langHdrMenu')?.classList.remove('open');
});
function updateLangHdrActive(){
  document.querySelectorAll('.lang-hdr-opt').forEach(opt=>{
    opt.classList.toggle('active', opt.dataset.lang===currentLang);
  });
}

const NOTIF_MESSAGES_ALL={
  pt:{
    draft_reminder:[
      '{client}: O post "{note}" ainda est\u00E1 como Rascunho. J\u00E1 foi aprovado?',
      'Lembrete: "{note}" de {client} aguarda aprova\u00E7\u00E3o h\u00E1 {days} dia(s).',
      '{client} tem um rascunho pendente desde {date}. J\u00E1 est\u00E1 pronto?',
      'Oi! O rascunho de {client} est\u00E1 parado faz {days} dia(s). Rolar?',
    ],
    approved_reminder:[
      '"{note}" de {client} foi aprovado! Deseja agendar ou j\u00E1 publicou?',
      '{client}: Post aprovado h\u00E1 {days} dia(s). Que tal agendar agora?',
      'Post aprovado de {client} ainda n\u00E3o foi agendado. Tudo certo?',
      '{client} aprovou! S\u00F3 falta agendar ou publicar. Bora?',
    ],
    scheduled_reminder:[
      '\u23F0 Hora de publicar! Post de {client} est\u00E1 agendado para {time}. Confirme a publica\u00E7\u00E3o.',
      '\uD83D\uDE80 {client}: Post agendado para {time}. J\u00E1 foi ao ar?',
      '\uD83D\uDCF2 Verifica\u00E7\u00E3o: Post de {client} programado para hoje \u00E0s {time}.',
      '\u23F0 {client}: Est\u00E1 na hora, post agendado para {time}. Publicou?',
    ],
    workspace_join:[
      '\uD83D\uDD14 {name} quer entrar no workspace {workspace}.',
      '\uD83D\uDC4B Nova solicita\u00E7\u00E3o de {name} para {workspace}.',
    ],
  },
  en:{
    draft_reminder:[
      '{client}: The post "{note}" is still a Draft. Approved yet?',
      'Reminder: "{note}" from {client} has awaited approval for {days} day(s).',
      '{client} has a pending draft since {date}. Ready yet?',
      'Hey! {client}\u2019s draft has been sitting for {days} day(s). Move it along?',
    ],
    approved_reminder:[
      '"{note}" from {client} was approved! Want to schedule or already published?',
      '{client}: Post approved {days} day(s) ago. Time to schedule it?',
      'Approved post from {client} still isn\u2019t scheduled. All good?',
      '{client} approved it! Just needs scheduling or publishing. Go?',
    ],
    scheduled_reminder:[
      '\u23F0 Time to publish! {client}\u2019s post is scheduled for {time}. Confirm it went live.',
      '\uD83D\uDE80 {client}: Post scheduled for {time}. Already live?',
      '\uD83D\uDCF2 Check: {client}\u2019s post is scheduled for today at {time}.',
      '\u23F0 {client}: It\u2019s time, post scheduled for {time}. Published?',
    ],
    workspace_join:[
      '\uD83D\uDD14 {name} wants to join the {workspace} workspace.',
      '\uD83D\uDC4B New request from {name} for {workspace}.',
    ],
  },
  es:{
    draft_reminder:[
      '{client}: La publicacion "{note}" sigue como Borrador. \u00bfYa fue aprobada?',
      'Recordatorio: "{note}" de {client} espera aprobacion hace {days} dia(s).',
      '{client} tiene un borrador pendiente desde {date}. \u00bfYa esta listo?',
      '\u00a1Hola! El borrador de {client} lleva {days} dia(s) parado. \u00bfLo avanzamos?',
    ],
    approved_reminder:[
      '\u00a1"{note}" de {client} fue aprobado! \u00bfProgramar o ya se publico?',
      '{client}: Publicacion aprobada hace {days} dia(s). \u00bfLa programamos?',
      'La publicacion aprobada de {client} aun no fue programada. \u00bfTodo bien?',
      '\u00a1{client} aprobo! Solo falta programar o publicar. \u00bfVamos?',
    ],
    scheduled_reminder:[
      '\u23F0 \u00a1Hora de publicar! La publicacion de {client} esta programada para las {time}. Confirma que sali\u00f3.',
      '\uD83D\uDE80 {client}: Publicacion programada para las {time}. \u00bfYa esta publicada?',
      '\uD83D\uDCF2 Verificacion: Publicacion de {client} programada hoy a las {time}.',
      '\u23F0 {client}: Es la hora, publicaci\u00F3n programada para las {time}. \u00bfPublicaste?',
    ],
    workspace_join:[
      '\uD83D\uDD14 {name} quiere unirse al workspace {workspace}.',
      '\uD83D\uDC4B Nueva solicitud de {name} para {workspace}.',
    ],
  },
};
let NOTIF_MESSAGES=NOTIF_MESSAGES_ALL[currentLang]||NOTIF_MESSAGES_ALL.pt;

const WIZARD_STEPS_ALL={
  pt:[
    {icon:'\uD83D\uDE80',title:'Bem-vindo ao NOOMA!',sub:'Sua central completa de gest\u00E3o criativa. Calend\u00E1rio, projetos, clientes e equipe: tudo em um s\u00F3 lugar.',fields:[{type:'info',text:'Gerencie posts, v\u00EDdeos, fotos, tr\u00E1fego pago, sites e eventos. Acompanhe prazos, pagamentos e entregas. Convide sua equipe e colaborem em tempo real.'}]},
    {icon:'\uD83D\uDC65',title:'Quem s\u00E3o seus clientes?',sub:'Adicione pelo menos um cliente ou marca para come\u00E7ar.',fields:[{type:'client_wizard',placeholder:'Ex: @noomaagencia, Loja do Jo\u00E3o, Active Health...'}]},
    {icon:'\uD83D\uDCF1',title:'Quais plataformas voc\u00EA usa?',sub:'Selecione as redes sociais e plataformas que voc\u00EA gerencia.',fields:[{type:'platform_picker',options:['Instagram','YouTube','TikTok','Facebook','LinkedIn','Twitter/X','Pinterest','Kwai']}]},
    {icon:'\uD83D\uDCC5',title:'Como funciona o Calend\u00E1rio',sub:'Sua central de conte\u00FAdo, organizada por dia.',fields:[{type:'feature_list',items:[
      {icon:'calendar',title:'Clique em qualquer dia',desc:'Adicione posts escolhendo cliente, tipo de conte\u00FAdo e plataforma.'},
      {icon:'check-circle',title:'Acompanhe o status',desc:'Rascunho, revis\u00E3o, aprovado, agendado ou publicado, tudo colorido e visual.'},
      {icon:'layers',title:'Troque de visualiza\u00E7\u00E3o',desc:'M\u00EAs, semana ou lista: use o que fizer mais sentido pra voc\u00EA.'},
      {icon:'search',title:'Filtre e busque',desc:'Por cliente, tipo de conte\u00FAdo ou plataforma, na barra lateral.'},
    ]}]},
    {icon:'\uD83D\uDCBC',title:'Como funcionam os Projetos',sub:'Gest\u00E3o completa de propostas, prazos e pagamentos.',fields:[{type:'feature_list',items:[
      {icon:'briefcase',title:'Crie um projeto',desc:'Defina cliente, prazo, valor, forma de pagamento e checklist de entregas.'},
      {icon:'refresh-cw',title:'Avance o status',desc:'Do primeiro contato at\u00E9 conclu\u00EDdo: crie suas pr\u00F3prias etapas se quiser.'},
      {icon:'rocket',title:'Aparece no Calend\u00E1rio',desc:'Quando um projeto \u00E9 entregue ou conclu\u00EDdo, ele entra automaticamente no seu calend\u00E1rio.'},
      {icon:'package',title:'Exporte relat\u00F3rios',desc:'Gere um relat\u00F3rio em Excel, PDF ou Word com os projetos que voc\u00EA escolher.'},
    ]}]},
    {icon:'\u2705',title:'Como funcionam as Tarefas',sub:'Sua lista do dia a dia, simples e sempre \u00E0 m\u00E3o.',fields:[{type:'feature_list',items:[
      {icon:'check-circle',title:'Crie uma tarefa em segundos',desc:'S\u00F3 o nome j\u00E1 basta: adicione checklist, descri\u00E7\u00E3o, prioridade e data se quiser.'},
      {icon:'flag',title:'Marque prioridade e prazo',desc:'Organize o que \u00E9 mais urgente e o que tem data pra acontecer.'},
      {icon:'refresh-cw',title:'Ela fica at\u00E9 voc\u00EA concluir',desc:'N\u00E3o terminou no dia? Sem problema: a tarefa continua ali at\u00E9 voc\u00EA marcar como feita.'},
    ]}]},
    {icon:'\uD83C\uDFE2',title:'Sozinho ou em equipe?',sub:'Comece no seu espa\u00E7o pessoal, ou traga a ag\u00EAncia inteira quando fizer sentido.',fields:[{type:'feature_list',items:[
      {icon:'user',title:'Voc\u00EA come\u00E7a no Workspace Pessoal',desc:'\u00C9 o seu espa\u00E7o individual, pronto pra usar sozinho, sem precisar configurar nada.'},
      {icon:'building',title:'Crie um Workspace de Equipe quando quiser',desc:'Trabalha numa ag\u00EAncia ou empresa? Crie um workspace compartilhado e convide todo mundo pra colaborar nos mesmos clientes e projetos.'},
      {icon:'users',title:'Cada pessoa com seu papel',desc:'Dono controla tudo, Editor cria e edita, Visualizador s\u00F3 acompanha: voc\u00EA escolhe o que cada um pode fazer.'},
      {icon:'send',title:'Entrada por convite',desc:'Compartilhe um c\u00F3digo com sua equipe; quem pedir pra entrar fica esperando sua aprova\u00E7\u00E3o antes de ter acesso.'},
    ]}]},
  ],
  en:[
    {icon:'\uD83D\uDE80',title:'Welcome to NOOMA!',sub:'Your complete creative management hub. Calendar, projects, clients and team: all in one place.',fields:[{type:'info',text:'Manage posts, videos, photos, paid ads, websites and events. Track deadlines, payments and deliverables. Invite your team and collaborate in real time.'}]},
    {icon:'\uD83D\uDC65',title:'Who are your clients?',sub:'Add at least one client or brand to get started.',fields:[{type:'client_wizard',placeholder:'E.g.: @youragency, Client Name, Active Health...'}]},
    {icon:'\uD83D\uDCF1',title:'Which platforms do you use?',sub:'Select the social networks and platforms you manage.',fields:[{type:'platform_picker',options:['Instagram','YouTube','TikTok','Facebook','LinkedIn','Twitter/X','Pinterest','Kwai']}]},
    {icon:'\uD83D\uDCC5',title:'How the Calendar works',sub:'Your content hub, organized by day.',fields:[{type:'feature_list',items:[
      {icon:'calendar',title:'Click any day',desc:'Add posts by choosing a client, content type and platform.'},
      {icon:'check-circle',title:'Track the status',desc:'Draft, review, approved, scheduled or published: all color-coded and visual.'},
      {icon:'layers',title:'Switch views',desc:'Month, week or list: use whatever makes sense for you.'},
      {icon:'search',title:'Filter and search',desc:'By client, content type or platform, right in the sidebar.'},
    ]}]},
    {icon:'\uD83D\uDCBC',title:'How Projects works',sub:'Full management of proposals, deadlines and payments.',fields:[{type:'feature_list',items:[
      {icon:'briefcase',title:'Create a project',desc:'Set client, deadline, value, payment method and deliverables checklist.'},
      {icon:'refresh-cw',title:'Move the status forward',desc:'From first contact to completed: create your own stages if you want.'},
      {icon:'rocket',title:'Shows up on the Calendar',desc:'When a project is delivered or completed, it\u2019s automatically added to your calendar.'},
      {icon:'package',title:'Export reports',desc:'Generate an Excel, PDF or Word report with whichever projects you choose.'},
    ]}]},
    {icon:'\u2705',title:'How Tasks works',sub:'Your day-to-day list, simple and always within reach.',fields:[{type:'feature_list',items:[
      {icon:'check-circle',title:'Create a task in seconds',desc:'The name alone is enough: add a checklist, description, priority and date if you want.'},
      {icon:'flag',title:'Set priority and due date',desc:'Organize what\u2019s most urgent and what has a deadline.'},
      {icon:'refresh-cw',title:'It stays until you finish it',desc:'Didn\u2019t finish it today? No problem: the task stays there until you mark it as done.'},
    ]}]},
    {icon:'\uD83C\uDFE2',title:'Solo or as a team?',sub:'Start in your personal space, or bring your whole agency in when it makes sense.',fields:[{type:'feature_list',items:[
      {icon:'user',title:'You start in your Personal Workspace',desc:'That\u2019s your own individual space, ready to use solo, no setup needed.'},
      {icon:'building',title:'Create a Team Workspace whenever you want',desc:'Work at an agency or company? Create a shared workspace and invite everyone to collaborate on the same clients and projects.'},
      {icon:'users',title:'Everyone gets their own role',desc:'Owner controls everything, Editor creates and edits, Viewer just follows along: you choose what each person can do.'},
      {icon:'send',title:'Join by invite',desc:'Share a code with your team; anyone who asks to join waits for your approval before getting access.'},
    ]}]},
  ],
  es:[
    {icon:'\uD83D\uDE80',title:'\u00a1Bienvenido a NOOMA!',sub:'Tu central completa de gesti\u00F3n creativa. Calendario, proyectos, clientes y equipo: todo en un solo lugar.',fields:[{type:'info',text:'Gestiona publicaciones, videos, fotos, trafico pago, sitios web y eventos. Sigue plazos, pagos y entregas. Invita a tu equipo y colabora en tiempo real.'}]},
    {icon:'\uD83D\uDC65',title:'\u00bfQuienes son tus clientes?',sub:'Anade al menos un cliente o marca para empezar.',fields:[{type:'client_wizard',placeholder:'Ej: @tuagencia, Nombre del Cliente, Active Health...'}]},
    {icon:'\uD83D\uDCF1',title:'\u00bfQue plataformas usas?',sub:'Selecciona las redes sociales y plataformas que gestionas.',fields:[{type:'platform_picker',options:['Instagram','YouTube','TikTok','Facebook','LinkedIn','Twitter/X','Pinterest','Kwai']}]},
    {icon:'\uD83D\uDCC5',title:'Como funciona el Calendario',sub:'Tu central de contenido, organizada por dia.',fields:[{type:'feature_list',items:[
      {icon:'calendar',title:'Haz clic en cualquier dia',desc:'Anade publicaciones eligiendo cliente, tipo de contenido y plataforma.'},
      {icon:'check-circle',title:'Sigue el status',desc:'Borrador, revisi\u00F3n, aprobado, programado o publicado: todo con colores y visual.'},
      {icon:'layers',title:'Cambia de vista',desc:'Mes, semana o lista: usa lo que tenga mas sentido para ti.'},
      {icon:'search',title:'Filtra y busca',desc:'Por cliente, tipo de contenido o plataforma, en la barra lateral.'},
    ]}]},
    {icon:'\uD83D\uDCBC',title:'Como funciona Proyectos',sub:'Gestion completa de propuestas, plazos y pagos.',fields:[{type:'feature_list',items:[
      {icon:'briefcase',title:'Crea un proyecto',desc:'Define cliente, plazo, valor, forma de pago y checklist de entregas.'},
      {icon:'refresh-cw',title:'Avanza el status',desc:'Desde el primer contacto hasta completado: crea tus propias etapas si quieres.'},
      {icon:'rocket',title:'Aparece en el Calendario',desc:'Cuando un proyecto es entregado o completado, se anade automaticamente a tu calendario.'},
      {icon:'package',title:'Exporta informes',desc:'Genera un informe en Excel, PDF o Word con los proyectos que elijas.'},
    ]}]},
    {icon:'\u2705',title:'C\u00F3mo funcionan las Tareas',sub:'Tu lista del d\u00EDa a d\u00EDa, simple y siempre a mano.',fields:[{type:'feature_list',items:[
      {icon:'check-circle',title:'Crea una tarea en segundos',desc:'Solo el nombre ya es suficiente: agrega checklist, descripci\u00F3n, prioridad y fecha si quieres.'},
      {icon:'flag',title:'Marca prioridad y plazo',desc:'Organiza lo que es m\u00E1s urgente y lo que tiene una fecha para suceder.'},
      {icon:'refresh-cw',title:'Se queda hasta que la completes',desc:'\u00BFNo la terminaste hoy? No hay problema: la tarea sigue ah\u00ED hasta que la marques como hecha.'},
    ]}]},
    {icon:'\uD83C\uDFE2',title:'\u00BFSolo o en equipo?',sub:'Empieza en tu espacio personal, o trae a toda tu agencia cuando tenga sentido.',fields:[{type:'feature_list',items:[
      {icon:'user',title:'Empiezas en tu Workspace Personal',desc:'Es tu espacio individual, listo para usar solo, sin necesidad de configurar nada.'},
      {icon:'building',title:'Crea un Workspace de Equipo cuando quieras',desc:'\u00BFTrabajas en una agencia o empresa? Crea un workspace compartido e invita a todos a colaborar en los mismos clientes y proyectos.'},
      {icon:'users',title:'Cada persona con su rol',desc:'El Due\u00F1o controla todo, el Editor crea y edita, el Espectador solo sigue: t\u00FA eliges qu\u00E9 puede hacer cada uno.'},
      {icon:'send',title:'Entrada por invitaci\u00F3n',desc:'Comparte un c\u00F3digo con tu equipo; quien pida entrar espera tu aprobaci\u00F3n antes de tener acceso.'},
    ]}]},
  ],
};

let WIZARD_STEPS=WIZARD_STEPS_ALL[currentLang]||WIZARD_STEPS_ALL.pt;
