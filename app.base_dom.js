if (!app) { app = {} }
app.baseDOM = function(callback) {
    app.fetch(app.server + 'ajax/menu_init.php')
        .then(function(d) {

            if (d && d.error && d.auth) {
                app.msg('Пожалуйста авторизуйтесь');
                app.modules.use('auth', function() { app.auth(); });
                return false;
            }

            if (d.error && !d.auth) { app.el.wrapper.innerHTML = d.error; return false; }
            if (!d.user || (d.user && !d.user.id)) {
                app.msg('Пожалуйста авторизуйтесь');
                app.modules.use('auth', function() { app.auth(); });
                return false;
            }
            var lsUser = ls.get('user');
            if (lsUser && lsUser.length) { lsUser = JSON.parse(lsUser); } else { lsUser = false; }
            if (!lsUser.id) { ls.set('user', JSON.stringify(d.user)); }

            app.user = d.user;
            if (d.user.time_end) {
                if (parseInt(d.user.time_end.substr(0, 2)) < parseInt(new Date().toTimeString().substr(0, 2))) {
                    app.fetch(app.root + 'ajax/report_9_daily_check.php').then(x => {
                        if (x.num_rows == 0) {
                            app.msg('Не забудьте про отчет о проделанной работе', 'success').then((noty) => {
                                noty.addAction('к отчету', function() {
                                    app.navigate('main/9')
                                })

                                noty.addAction(new Icon('external-link'), function() {
                                    app.navigate('main/9', true)
                                })
                            })
                        }
                    })
                }
            }


            if (d.user && d.user.require_change_psw && d.user.require_change_psw == 1) {
                //app.msg( crEl({c:'text-primary'},new Icon('user-secret'),' \u00a0 Пожалуйста измените пароль для входа в систему').outerHTML,'primary')
                app.modules.use('app.profile').then(() => {
                    app.profile.changePassword(() => {
                        d.user.require_change_psw = 0;
                    })
                })
            }


            app.el.wrapper.empty(); // чистка враппера

            /*МЕНЮ*/
            app.el.sideMenu = crEl('ul', { c: 'nav metismenu', id: 'side-menu', style: 'display:block' })
            app.el.sideMenu.appendChild(crEl('li', { c: 'nav-header' },
                crEl('div', { c: 'dropdown profile-element' },
                    crEl('span', crEl('img', { src: app.server + d.user.photo, width: 48, c: 'img-circle', alt: d.user.name })),
                    crEl('a', { href: 'javascript:void(0)', c: 'dropdown-toggle', d: { toggle: 'dropdown' }, 'aria-expanded': false },
                        crEl('span', { c: 'clear' },
                            crEl('span', { c: 'block m-t-xs' }, crEl('strong', { c: 'font-bold' }, d.user.name)),
                            crEl('span', { c: 'text-muted text-xs block' }, d.user.email, crEl('b', { c: 'caret' }))
                        )
                    ),
                    crEl('ul', { c: 'dropdown-menu animated fadeInUp m-t-xs' },
                        crEl('li', crEl('a', {
                            href: nav(),
                            e: {
                                click: function() {
                                    app.fetch(app.root + 'ajax/logout.php').then(app.init)
                                }
                            }
                        }, 'Выйти')),
                        crEl('li', crEl('a', { href: nav('profile') }, 'Настройки профиля')),
                        crEl('li', crEl('a', { href: nav('profile/notif') }, 'Настройки уведомлений')),
                        crEl('li', crEl('a', { href: nav('profile/integrations') }, 'Внешние сервисы'))
                    )
                ),
                crEl('div', { style: 'position:absolute; left:6px; top:6px; color:#fff; opacity:0.8', id: 'appQueue' }, '')
            ));

            function lMenuItem(data) {
                let li = crEl('li', new A({ href: data.hash },
                    new Icon(data.icon),
                    crEl('span', { c: 'nav-label' }, data.name)
                ));

                switch (data.hash) {
                    case 'contacts':
                        /*li.prepend(crEl('a',{s:'color:inherit', c:'arrow', title:'Добавить контакт',e:{click: function(e){
                        	e.stopPropagation();
                        	app.modules.use('app.contacts.add').then(function(){ app.contacts.add() })
                        	return;
                        }}}, '+'));*/
                        break;
                    case 'contragents':
                        /*li.prepend(crEl('a',{s:'color:inherit', c:'arrow', title:'Добавить контрагента',e:{click: function(e){
                        	e.stopPropagation();
                        	app.modules.use('app.contragents.add').then(function(){ app.contragents.add() })
                        	return;
                        }}}, '+'));*/
                        break;

                }

                return li;
            }
            for (var i = 0, l = d.menu.length; i < l; i++) {
                app.el.sideMenu.appendChild(new lMenuItem(d.menu[i]));
            }

            app.el.wrapper.appendChild(crEl('nav', { c: 'navbar-default navbar-static-side', role: 'navigation' },
                crEl('div', { c: 'slimScrollDiv', s: 'position: relative; ' },
                    crEl('div', { c: 'sidebar-collapse', s: 'overflow: hidden; width: auto; ' },
                        app.el.sideMenu
                    )
                )
            ));





            var docWidth = $(document).width();
            if (docWidth < 1000 || ls.get('mainMenuCollapse')) {
                document.body.classList.add('mini-navbar');
            }

            /*ШАПКА*/
            app.el.navbarToggler = crEl('a', {
                href: 'javascript:void(0)',
                c: 'navbar-minimalize minimalize-styl-2 btn btn-primary',
                events: {
                    click: function() {
                        document.body.classList.toggle('mini-navbar');


                        if (document.body.classList.contains('mini-navbar')) {
                            ls.set('mainMenuCollapse', '1')
                        } else {
                            ls.unset('mainMenuCollapse')
                        }

                        if (!document.body.classList.contains('mini-navbar') || document.body.classList.contains('body-small')) {
                            app.el.sideMenu.style.display = 'none';
                            setTimeout(function() { $(app.el.sideMenu).fadeIn(500); }, 100);



                        } else if (document.body.classList.contains('fixed-sidebar')) {
                            app.el.sideMenu.style.display = 'none';
                            setTimeout(function() { $(app.el.sideMenu).fadeIn(500); }, 300);


                        } else {
                            app.el.sideMenu.removeAttribute('style');

                        }
                    }
                }
            }, new Icon('bars'))
            /*app.el.navbarLeft = crEl('div', { c: 'navbar-form-custom' },
                crEl('div', { c: 'form-group' }, crEl('input', { c: 'form-control' }))
            );*/

            app.el.navbarRight = crEl('ul', { c: 'nav navbar-top-links navbar-right' },
                // crEl('li', { c: 'm-r-sm text-muted welcome-message' }, 'Система управления проектами'),
                crEl('li', { c: 'm-r-sm', id: 'mpm_timer' }, ''),
                crEl('li', { c: 'dropdown' },
                    crEl('a', {
                        c: 'dropdown-toggle count-info',
                        // s: 'opacity:0.2',
                        title: 'Последние комментарии и уведомления',
                        onclick: function() {
                            app.modules.use('app.news').then(() => {

                                app.news.init()

                            })
                        },
                        href: 'javascript:void(0)'
                    }, new Icon('bell'), crEl('small', { c: 'label', s: 'background:transparent; font-size:8px; color:#fff', id: 'global-last-comments-counter' }, ''))
                ),
                crEl('li', { c: 'dropdown' },
                    crEl('a', {
                        c: 'dropdown-toggle count-info',
                        title: 'Чат-болталка! НЕ ТЫЧЬ, пока всё равно не работает!!!',
                        onclick: function() {
                            app.chat.showChat();
                        },
                        href: 'javascript:void(0)'
                    }, new Icon('envelope'), crEl('small', { c: 'label', s: 'background:transparent; font-size:8px; color:#fff', id: 'global-chat-counter' }, '0'))
                ), /**/
                crEl('li', crEl('a', {
                    c: 'right-sidebar-toggle',
                    onclick: function() {
                        let sb = document.getElementById('right-sidebar');
                        sb.classList.toggle('sidebar-open');
                        if (sb.classList.contains('sidebar-open')) {
                            app.modules.use('app.rightSidebar').then(() => {
                                app.rightSidebar.init(sb);
                            })
                        }
                    },
                    href: 'javascript:void(0)'
                }, new Icon('tasks')))
            );

            app.el.pageHeader = crEl('div', { c: 'row wrapper border-bottom page-heading', id: 'pageHeader' }); //white-bg
            app.el.pageContent = crEl('div', { c: 'wrapper wrapper-content', id: 'pageContent' });
            app.el.pageFooter = crEl('div', { c: 'footer' },
                crEl('div', { c: 'pull-right' }, ':)'),
                crEl('div',
                    crEl('strong', 'Copyright'),
                    " Company © 2012-" + (new Date().getFullYear())
                )
            );


            app.el.pageWrapper = crEl('div', { c: 'gray-bg dashbard-1', id: 'page-wrapper', s: '    min-height: calc( 100vh - 60px )' },
                crEl('div', { c: 'row border-bottom' },
                    crEl('nav', { c: 'navbar navbar-fixed-top', role: 'navigation', s: 'margin-bottom: 0' },
                        crEl('div', { c: 'navbar-header' },
                            app.el.navbarToggler,
                            app.el.navbarLeft
                        ),
                        
                        app.el.navbarRight,
                        app.el.pageHeader
                    )
                ),
                //app.el.pageHeader,
                app.el.pageContent,
                app.el.pageFooter
            );

            app.el.wrapper.appendChild(app.el.pageWrapper);

            app.el.rightSidebar = crEl('div', { c: 'sidebar-container', s: ' width: auto; height: 100%;' });

            app.el.rightSidebarNews = crEl('div', { c: 'sidebar-container', s: ' width: auto; height: 100%;' });

            app.el.rightSidebarChat = crEl('div', { c: 'sidebar-container', s: ' width: auto; height: 100%;' });
            /*app.el.rightSidebar.open = function(){ app.el.rightSidebar.parentNode.parentNode.classList.add('sidebar-open') }
		app.el.rightSidebar.close = function(){ app.el.rightSidebar.parentNode.parentNode.classList.remove('sidebar-open') }
		app.el.rightSidebar.toggle = function(){ app.el.rightSidebar.parentNode.parentNode.classList.toggle('sidebar-open') }
				
*/






            app.el.wrapper.appendChild(crEl('div', { id: 'right-sidebar', s: 'overflow: visible' },
                crEl('div', { s: 'position: relative; width: auto; height: 100%;' }, app.el.rightSidebar)
            ));
            app.el.wrapper.appendChild(crEl('div', { id: 'right-sidebar-news', s: 'overflow: visible' },
                crEl('div', { s: 'position: relative; width: auto; height: 100%;' }, app.el.rightSidebarNews)
            ));
            app.el.wrapper.appendChild(crEl('div', { id: 'right-sidebar-chat', s: 'overflow: visible' },
                crEl('div', { s: 'position: relative; width: auto; height: 100%;' }, app.el.rightSidebarChat)
            ));

            if (typeof(callback) === 'function') { callback() }

            app.include(['assets/lib/jquery-slimscroll/jquery.slimscroll.js'], function() {
                $(".slimScrollDiv").slimScroll({
                    height: '100%',
                    opacity: 0.4
                });
                $(".slimScrollBar").hide()
            })



        }, app.error);
}
