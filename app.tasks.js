/**
 *  Задачи
 * @class app.tasks
 * @memberof app
 * @instance
 */






app.tasks = {
    el: {
        /**
         *  DOM элементы задач
         * @property tasks.el
         * @type {Object}
         */
    },

    /**
     * Инициализации отображения задач
     * @method app.tasks.init
     */



    groups: {
        list: {
            all: 'все задачи',
            project: 'проект',
            state: 'состояние',
            deadline: 'срок',
            priority: 'приоритет',
            assignee: 'исполнитель',
            contact: 'контактное лицо',
        },
        init: function(preset) {
            if (!preset) { preset = 'all'; }
            var a = document.getElementById("task_group_toggler"),
                menu = document.getElementById("task_group_toggler_menu");
            if (a) {
                a.empty();
                a.innerHTML = app.tasks.groups.list[preset];
            }
            if (menu) {
                menu.empty();
                for (var k in app.tasks.groups.list) {
                    menu.appendChild(crEl('li', { c: (k === preset ? 'active' : '') }, crEl('a', { href: 'javascript:app.tasks.groups.set("' + k + '")' }, app.tasks.groups.list[k])));
                }
            }

        },
        set: function(name) {
            var tasks_param = JSON.parse(ls.get('tasks_params') || '{}');
            tasks_param.group = name;
            ls.set('tasks_params', JSON.stringify(tasks_param));
            var tasksList = app.el.pageContent.querySelector('.tasks-container');
            if (name !== 'all') { tasksList.classList.add('taks-list-gropped'); } else { tasksList.classList.remove('taks-list-gropped'); }
            app.tasks.load();
        },
        clear: function() {

        }
    },

    init: function(mode, query) {
        'use strict';

        let title = 'Задачи';
        switch (mode) {
            case 'my':
                title = 'Мои задачи';
                break;
            case 'meeting':
                title = 'Встречи';
                break;
            case 'author':
                title = 'Задачи в которых я автор';
                break;
            case 'planes':
                title = 'Запланированные задачи';
                break;
            case 'all':
                title = 'Задачи из всех категорий';
                break;
            case 'archived':
                title = 'Архивные задачи';
                break;
        }
        app.el.pageContent.empty();
        app.setTitle(title)
        const curViewMode = ls.get('task_view_mode_all') || 'list';
        app.el.pageHeader.empty().appendChild(
            crEl('div', {c: 'col-sm-3'}, crEl('h2', title, crEl('small', { c: 'm-l', id: 'tasksHeaderCaption' }))));

        app.el.pageHeader.appendChild(
            crEl('div', { c: 'col-sm-5' },
                crEl('ol', { c: 'breadcrumb', s: 'display:none', id: 'tasksBreadcrumb' },
                    crEl('li', crEl('a', {
                        href: nav(),
                        e: {
                            click: function() {
                                location.href = (location.origin + location.pathname);
                            }
                        }
                    }, 'X')))
            ));
        app.el.pageHeader.appendChild(
            crEl('div', {c: 'col-sm-4'},
                crEl('div', { c: 'pull-right' },
                        
                    crEl('form', {
                            c: 'mail-search p-w-md',
                            s: 'display:inline-block',
                            e: {
                                submit: function(event) {
                                    event.preventDefault();
                                    let v = document.getElementById("search").value.trim().toLowerCase();
                                    if (v.length) {
                                        app.tasks.filters.set('q', v);
                                        app.tasks.init(mode, app.tasks.filters.setToUrl())

                                    } else {
                                        app.tasks.filters.set('q');
                                        app.tasks.init(mode, app.tasks.filters.setToUrl())
                                    }
                                    return false;
                                }
                            }
                        },
                        crEl('input', {
                            placeholder: 'Найти',
                            name: 'q',
                            id: 'search',
                            c: 'form-control input-sm',
                            type: 'search',
                            value: '',
                            onfocus: function() {
                                if (!app.tasks.filters) {
                                    app.tasks.filtersInit(() => {
                                        console.info('Filter is inited manual from search');
                                    })
                                }
                            }
                        }),
                        crEl('div', { c: 'input-group', id: 'contact_search_container' },
                            crEl('a', {
                                href: 'javasript:void(0)',
                                c: 'close',
                                s: 'position:absolute',
                                e: {
                                    click: function() {
                                        app.tasks.filters.set('q');
                                        app.tasks.init(mode, app.tasks.filters.setToUrl())
                                    }
                                }
                            }, new MIcon('close', 'md-18'))
                        )
                    ),
                    new Btn({ c: 'btn btn-xs btn-white', title: 'Переключить отображение Список/Канбан', d: { current: curViewMode } }, new Icon(curViewMode === 'list' ? 'th' : 'th-list'), function() {
                        if (this.dataset.current === 'list') {
                            this.dataset.current = 'kanban';
                            this.empty().append(new Icon('th-list'))
                            ls.set('task_view_mode_all', 'kanban')
                        } else {
                            this.dataset.current = 'list';
                            this.empty().append(new Icon('th'))
                            ls.set('task_view_mode_all', 'list')
                        }
                        app.tasks.init(mode, query)
                    }),
                    crEl('div', { c: 'pull-right' },
                        crEl('button', {
                            c: 'btn-icon no-borders none-bg filter-btn', //white-bg
                            id: 'tasksFilterToggler',
                            e: {
                                click: function() {


                                    if (!app.tasks.filters) {
                                        document.getElementById("right-sidebar").empty().append(app.constructor.InlinePreloader('Загрузка фильтров'))
                                        app.tasks.filtersInit(() => {
                                            console.info('Filter is inited manual');
                                        })
                                    }

                                    document.getElementById("right-sidebar").classList.toggle('sidebar-open')
                                }
                            }
                        }, new Icon('filter'))
                    )

                )
            )
        );
        //)



        app.tasks.el.inboxContainer = crEl('div', { c: 'row', id: 'inboxContainer' });
        app.tasks.el.newContainer = crEl('div', { c: 'row', id: 'newContainer' });
        app.tasks.el.tasksContainer = crEl('div', { c: 'row', id: 'tasksContainer' }, new app.constructor.InlinePreloader('Загрузка задач'));
        app.el.pageContent.empty().appendChild(crEl('div', { c: 'row' },
            crEl('div', { c: 'col-lg-12' }, app.tasks.el.inboxContainer),
            crEl('div', { c: 'col-lg-12' }, app.tasks.el.newContainer)
        ));




        app.el.pageContent.appendChild(app.tasks.el.tasksContainer);



        if (!mode) { mode = 'my' }

        if (/[a-z]+/.test(mode)) {


            var tasks_param = JSON.parse(ls.get('tasks_params') || '{}');
            tasks_param.mode = mode;
            ls.set('tasks_params', JSON.stringify(tasks_param));


            /*	this.load(function(){  app.tasks.el.tasksContainer.animate('fadeIn') });*/






            app.tasks.mode = mode;

            if (query && query.length) {
                app.tasks.filtersInit(() => {})
            } else {

                if (mode == 'archived') {
                    app.tasks.el.tasksContainer.empty().append(crEl('div',

                        'Настройте фильтры для отображения архивных задач используя значок фильтра в правом верхнем углу',


                    ))


                    if (!app.tasks.filters) {
                        document.getElementById("right-sidebar").empty().append(app.constructor.InlinePreloader('Загрузка фильтров'))
                        app.tasks.filtersInit(() => {
                            console.info('Filter is inited manual');
                        })
                    }

                    document.getElementById("right-sidebar").classList.toggle('sidebar-open')


                    return false;
                }


                log('Load tasks without filters')
                app.tasks.load(function() {
                    if (app.tasks.el.tasksContainer) {
                        app.tasks.el.tasksContainer.animate('fadeIn')
                    }

                    if (location.hash && /\d+/.test(location.hash)) {
                        let tid = location.hash.substr(1);
                        if (!app.el.pageContent.querySelector(".task[data-id='" + tid + "']").classList.contains('kanban-task')) {
                            setTimeout(() => {
                                app.tasks.oneToList(tid);
                                app.el.pageContent.querySelector(".task[data-id='" + tid + "']").classList.add('list-item--open')
                            }, 1)
                        }

                    }

                }, mode === 'my');


            }


        } else if (/[\d]+/.test(mode)) {
            this.loadOneTask(+mode, function() { if (app.tasks.el.tasksContainer) { app.tasks.el.tasksContainer.animate('fadeIn') } });
        }








    },

    filtersInit: function(callback) {

        app.modules.use('app.filters')
            .then(() => {

                var params = {};
                if (ls.get('tasks_params')) { params = JSON.parse(ls.get('tasks_params') || '{}'); }
                let pars = parseUrlParams(location.search.substr(1));
                for (let k in pars) { if (pars[k]) { params[k] = pars[k]; } }
                if (typeof mode === 'undefined') { mode = params.mode || 'my' }


                app.fetch(app.root + 'ajax/tasks_menu.php', params).then((fdata) => {


                    app.tasks.filters = app.filters({
                        container: document.getElementById("right-sidebar"),
                        key: 'pricesFilter',
                        filters: [{
                                caption: 'Найти',
                                parent: 'tasksFiltersTabBase',
                                type: 'input',
                                opts: { type: 'search', placeholder: 'Поиск по задачам' },
                                key: 'q'
                            },
                            {
                                parent: 'tasksFiltersTabBase',
                                type: 'delimer'
                            },


                            {
                                caption: 'Исполнитель',
                                parent: 'tasksFiltersTabBase',
                                type: 'tag',
                                opts: { placeholder: 'Выбрать исполнителя' },
                                key: 'assignee',
                                data: 'ajax/autocomplete.users.forQickAddTask.php',
                                params: { autoOpen: true, render: function(x) { return crEl('li', crEl('span', x.name)) } }
                            },

                            {
                                caption: 'Контактное лицо',
                                parent: 'tasksFiltersTabBase',
                                type: 'tag',
                                opts: { placeholder: 'Выбрать контакт' },
                                key: 'cid',
                                data: 'ajax/autocomplete.contacts.forQickAddTask.php',
                                params: { render: function(x) { return crEl('li', crEl('span', x.name)) } }
                            },

                            {
                                caption: 'Проект',
                                parent: 'tasksFiltersTabBase',
                                type: 'tag',
                                opts: { placeholder: 'Выбрать проект' },
                                key: 'pid',
                                data: 'ajax/autocompleteProjects.php',
                                params: { autoOpen: true, render: function(x) { return crEl('li', crEl('span', x.name)) } }
                            },

                            {
                                caption: 'Теги',
                                parent: 'tasksFiltersTabBase',
                                type: 'tag',
                                opts: { placeholder: 'Выбрать теги' },
                                key: 'tid',
                                data: 'ajax/autocomplete.tags.php',
                                params: { autoOpen: true, render: function(x) { return crEl('li', crEl('span', x.name)) } }
                            },

                            {
                                caption: 'Приоритет',
                                parent: 'tasksFiltersTabBase',
                                type: 'select',
                                key: 'priority',
                                data: [3, 2, 1].map((x) => { return { id: x, name: [0, 'Низкий', 'Обычный', 'Высокий'][+x] } })
                            },

                            {
                                caption: 'Состояние',
                                parent: 'tasksFiltersTabBase',
                                type: 'select',
                                key: 'sid',
                                data: fdata.groups.states
                            },

                            {
                                caption: 'Архивные',
                                parent: 'tasksFiltersTabAdditional',
                                type: 'select',
                                key: 'archive',
                                data: [
                                    { id: 1, name: 'Только архивные' },
                                    { id: 2, name: 'Все включая архивные' }
                                ]
                            },


                            {
                                caption: 'Дата с',
                                parent: 'tasksFiltersTabAdditional',
                                type: 'dateUTS',
                                key: 'd1'
                            },
                            {
                                caption: 'Дата по',
                                parent: 'tasksFiltersTabAdditional',
                                type: 'dateUTS',
                                key: 'd2'
                            },

                            {
                                caption: 'Тип даты',
                                parent: 'tasksFiltersTabAdditional',
                                type: 'select',
                                key: 'period_mode',
                                data: [
                                    { id: "date_create", name: "Дата создания" },
                                    { id: "date", name: "Дата начала" },
                                    { id: "deadline", name: "Срок" },
                                    { id: "date_complete", name: "Дата завершения" }
                                ]
                            },

                        ],
                        tabs: [
                            { name: 'Основн', key: 'tasksFiltersTabBase' },
                            { name: 'Дополн', key: 'tasksFiltersTabAdditional' }
                        ],
                        onupdate: function(d, fs) {
                            console.log("UPDATE FILTERS", d);
                            d.forEach(x => {
                                if (x.name == 'q') {
                                    document.getElementById('search').value = x.value;
                                    return false;
                                }
                            })


                            try {

                                let brcf = document.getElementById("brcFilters")
                                if (brcf) { brcf.parentNode.removeChild(brcf) };
                                if (d && d.length) {
                                    let li = crEl('li', { id: 'brcFilters' }, crEl('a', {
                                        href: nav(),
                                        onclick: function() {
                                            document.getElementById("right-sidebar").classList.toggle('sidebar-open')
                                        }
                                    }, fs));
                                    document.getElementById("tasksBreadcrumb").append(li);
                                    document.getElementById("tasksBreadcrumb").style.display = 'block'
                                    li.animate('zoomInRight')
                                }

                                if (!app.tasks.el.tasksContainer) { app.tasks.el.tasksContainer = document.getElementById('tasksContainer'); }
                                if (!app.tasks.el.inboxContainer) { app.tasks.el.inboxContainer = document.getElementById('inboxContainer'); }




                                if (app.tasks.filters.firstInited || Object.keys(app.tasks.filters.list).some(x => { return app.tasks.filters.list[x] })) {
                                    app.tasks.load(function() { app.tasks.el.tasksContainer.animate('fadeIn') }, mode === 'my');

                                } else {
                                    app.tasks.filters.firstInited = true;
                                }
                                /*	if(mode==='my' && (!app.user || app.user.guest==0)){
                                		app.include(['assets/js/app.constructor.inbox.js'], function(){
                                			app.tasks.loadUntaskedInbox(function(){  app.tasks.el.inboxContainer.animate('fadeIn') });
                                		})
                                	} */

                            } catch (E) {

                                console.error(E)
                            }
                        },
                        onclose: function() {
                            document.getElementById("right-sidebar").classList.remove('sidebar-open')
                        }
                    })

                    app.tasks.filters.init(function() {

                            if (mode === 'my', (!app.user || app.user.guest == 0)) {
                                app.tasks.el.newContainer.empty().append(crEl({ c: 'col-sm-12', id: 'updatedTasksContainer', s: 'display:none' },
                                    crEl('h2', 'Недавно обновленные'), crEl('div', { c: '', id: 'tasksActual' }, crEl('div', { c: '' },
                                        crEl({ c: 'text-muted text-center' }, crEl('small', 'Скоро здесь будут отображаться недавно обновлённые задачи'))
                                    ))
                                ))
                                app.tasks.el.newContainer.animate('fadeIn');


                            }
                            if (typeof(callback) === 'function') {
                                callback();
                            }
                        }) //app.tasks.filters.init
                })
            })

    },

    /**
     *  Конструкторы для задач
     * @property app.tasks.constructor
     * @type {Object}
     */
    constructor: {


        Task: function(d) {},




        /**
         * Формирует DOM элемент комментария
         * @constructor app.tasks.constructor.Comment
         * @param {Object} comm - Данные вложжения
         * @return {Node}
         **/

        Comment: function(comm, id_task = 0) {

            let srcLink = '#';
            if ((comm.comment.mid_inbox && comm.comment.mid_inbox.length) || comm.comment.mid > 0) {
                if (comm.comment.mid_inbox.length && comm.comment.mid > 0) {
                    srcLink = app.user.id == comm.user.id ? 'outbox/' + comm.comment.mid : 'inbox/' + comm.comment.mid_inbox;
                } else {
                    srcLink = comm.comment.mid > 0 ? 'outbox/' + comm.comment.mid : 'inbox/' + comm.comment.mid_inbox
                }


            }


            var flags = crEl('div', { c: 'pull-right tasks-view-list-comment-flags', s: 'margin-left:8px' });
            if (comm.flags.bug && comm.flags.bug == 1) { flags.appendChild(new Icon('fa-bug')); }
            if (comm.flags.deadline && comm.flags.deadline == 1) { flags.appendChild(new Icon('fa-calendar-check-o')); }
            if (comm.flags.email && comm.flags.email > 0) { flags.appendChild(crEl('a', { href: nav(srcLink, true), title: 'Открыть письмо', target: '_blank' }, new Icon('fa-envelope-o'))); }
            if (comm.flags.state && comm.flags.state == 1) { flags.appendChild(new Icon('fa-code-fork')); }
            var p = crEl('p');



            p.innerHTML = app.tools.collapseEmailSignature(comm.comment.content);




            if (comm.flags.email > 0 && comm.comment.mid_inbox && comm.comment.mid_inbox.length > 3) {
                p.style.border = '1px dotted #e0e0e0'
                p.ondblclick = function() {
                    p.style.border = 'none';
                    p.innerHTML = null;
                    p.onclick = null;
                    let iframe = crEl('iframe', { frameborder: 0, s: 'width:100%', src: app.root + "blocks/mail_body.php?UID=" + encodeURIComponent(comm.comment.mid_inbox), events: { load: function() { $(this).height($(this).contents().find("html").height() + 20).fadeIn(300); } } });
                    p.appendChild(iframe);
                    iframe.animate('fadeIn')
                }
            };

            [].forEach.call(p.querySelectorAll('img'), function(img) {
                img.classList.add('comment-img-preview')
                img.onclick = function() {
                    app.imagePreview(this.src)
                }
            })

            function getListContacts() {
                let li = crEl('span', { c: 'title' },
                    crEl('small', { c: 'pull-right blue-text text-lighten-2', s: ' display:block; height:13px; line-height:19px;', title: comm.comment.ffdate }, comm.comment.fdate),
                    crEl('span', { c: 'truncate' }, comm.user.is_contact ? new app.constructor.ContactInline(comm.user.name, comm.user, 'click') : new app.constructor.UserInline(comm.user.name, comm.user, 'click'))
                    // comm.contacts ? comm.contacts.map(x => {crEl('span', {c: 'truncate'}, x.name)}) : undefined
                );
                if (comm.contacts) {
                    let block = li.appendChild(crEl());
                    console.log(comm.contacts);
                    for (let prop in comm.contacts) {
                        let item = comm.contacts[prop];
                        if (item.contact) {
                            block.appendChild(new app.constructor.ContactToTaskInline(item, id_task));
                        } else {
                            block.appendChild(crEl('a',{href:'javascript:void(0)', s: 'font-size:12px; margin-right: 10px; color: gray; text-decoration: underline;'}, new app.constructor.ContactInline(item.name + ' <' + item.email + '>', {id:item.id, name:item.name, photo:null, email:item.email},'click')));
                        }
                    }
                }
                return li;
            }

            var li = crEl('li', { c: 'comment-item' },
                flags,
                new app.constructor.Avatar(comm.user.photo, comm.user.name, { width: 40, height: 40, c: 'img-circle avatar' }),
                getListContacts(), p
            )

            if (comm.files && comm.files.length) {
                let commAttachs = crEl('div', { c: 'comment-item-attachs' });
                comm.files.forEach(function(aa) {
                    commAttachs.appendChild(new app.constructor.Attachment(aa));
                })
                li.appendChild(commAttachs);
            }

            return li;

        }
    },
    open: function(id) {
        let el = app.el.pageContent.querySelector(".task[data-id='" + id + "'] .list-item__header-subject");
        if (app.tasks) {
            el.click();
        } else {
            app.navigate('tasks/' + id)
        }

    },

    loadOneTask: function(id, callback) {
        app.tasks.el.tasksContainer.empty();



        console.info('app.tasks.el.tasksContainer', app.tasks.el.tasksContainer)
        const cont = app.tasks.el.tasksContainer;

        let isSale = location.hash && location.hash.indexOf('sale') != -1;


        app.setTitle((isSale ? 'Продажа' : 'Задача') + ' #' + id);
        app.fetch(app.root + 'ajax/tasks_headers_new.php', { id: id })
            .then((d) => {

                if (d && d.length === 0) {
                    app.tasks.el.tasksContainer.appendChild(crEl('div', { c: 'row' },
                        crEl('div', { c: 'col-lg-12' },
                            crEl('p', { c: 'alert alert-warning' }, (isSale ? 'Продажа' : 'Задача') + ' не найдена либо у вас нет доступа к ней. #' + id)
                        )));
                    return false;
                }

                var taskDom = new app.constructor.Task(d[0]);


                cont.appendChild(crEl('div', { c: 'row' },
                    crEl('div', { c: 'col-lg-12' },
                        crEl('h2', (isSale ? 'Продажа' : 'Задача') + ' #' + id),
                        taskDom
                    )));

                app.setTitle((isSale ? 'Продажа' : 'Задача') + ' #' + id + ' | ' + d[0].name);

                taskDom.classList.add('list-item--open');
                taskDom.classList.add('task-one');

                taskDom.querySelector('.list-item__header-subject').removeEventListener("click", taskDom.querySelector('.list-item__header-subject').onclick, false);
                taskDom.querySelector('.list-item__header-subject').onclick = null;

                //taskDom.querySelector('.list-item__header-subject').onclick = function(event){ event.preventDefault(); return;}
                app.tasks.oneToList(id);

                app.timer.init()

                if (d[0].child_count == 0) {
                    callback();
                } else {
                    app.fetch(app.root + 'ajax/tasks_headers_new.php', { mode: 'all', id_parent: id })
                        .then(function(sts) {
                            let subTasks = crEl('div');
                            sts.forEach(function(t) {
                                subTasks.appendChild(new app.constructor.Task(t))
                            })
                            app.tasks.el.tasksContainer.appendChild(crEl('div', { c: 'row' },
                                crEl('div', { c: 'col-lg-12' },
                                    crEl('h2', 'Подзадачи'),
                                    subTasks
                                )));

                            callback();
                        })
                }





                //



            })

    },

    /**
     * Загрузка списка задач
     * @method app.tasks.load
     */
    load: function(callback, loadActual) {;
        var params = {};



        if (ls.get('tasks_params')) { params = JSON.parse(ls.get('tasks_params') || '{}'); }
        app.tasks.el.tasksContainer && app.tasks.el.tasksContainer.empty().appendChild(crEl('div', { s: 'padding:20px' }, new app.constructor.InlinePreloader('Загрузка задач')));


        let pars = parseUrlParams(location.search.substr(1));
        for (let k in pars) {
            if (pars[k]) { params[k] = pars[k]; }
        }


        console.time('TasksLoading')
        app.fetch(app.root + 'ajax/tasks_headers_new.php', params).then(function(d) {
            console.timeEnd('TasksLoading')
            if (!app.tasks.el.tasksContainer) { app.tasks.el.tasksContainer = document.getElementById("tasksContainer") }
            if (!app.tasks.el.tasksContainer) { return false; }
            app.tasks.el.tasksContainer.empty()
            var taskContainer = app.el.pageContent.querySelector('.tasks-container') || crEl('div', { c: 'tasks-container col-lg-12' })
            taskContainer.empty();


            switch (ls.get('task_view_mode_all') || '') {
                case 'kanban':

                    app.modules.use('app.tasks.kanban').then(function() {
                        app.tasks.kanban.load(d, taskContainer, params, callback)
                    });


                    break;

                default:
                    app.modules.use('app.tasks.list').then(function() {
                        app.tasks.list.load(d, taskContainer, params, callback)
                    });
                    break;
            }


            if (taskContainer) { app.tasks.el.tasksContainer.appendChild(taskContainer); }





            if (params.mode === 'meeting') {


                function getServiceStatus(is_show_popup) {
                    let inboxHeaderCaption = document.getElementById("tasksHeaderCaption");
                    if (!inboxHeaderCaption) { return; }
                    inboxHeaderCaption.innerHTML = '';
                    app.fetch(app.root + 'ajax/service_calendars_status.php')
                        .then(function(d) {
                            if (d && d.error) { app.error(d.error); return; }

                            inboxHeaderCaption.classList.add('label')
                            inboxHeaderCaption.classList.add('label-dafault')
                            let label = crEl('a', { href: 'javascript:void(0)' }, 'Sync is off :(');
                            let cont1 = crEl('div', { c: 'list-group' })
                            $(label).popover({
                                container: '#tasksHeaderCaption',
                                content: crEl('div', { s: 'color:#333' },
                                    crEl('h4', 'Синхронизация'),
                                    cont1,
                                    crEl('div', { c: 'row' },
                                        crEl('div', { c: 'col-sm-6' },
                                            crEl('button', { c: 'btn btn-link btn-xs btn-block', e: { click: function() { window.open(app.path + '/profile/integrations') } } }, 'Аккаунты')
                                        ),
                                        crEl('div', { c: 'col-sm-6' },
                                            crEl('button', {
                                                id: 'addAccButn',
                                                c: 'btn btn-success btn-xs btn-block',
                                                e: {
                                                    click: function() {
                                                        app.modules.use('app.google')
                                                            .then(function() {
                                                                app.google.login('new')
                                                                    .then(function() {
                                                                        getServiceStatus(true);
                                                                        app.msg("Добавьте один или несколько календарей для синхронизации", 'success')
                                                                    })
                                                            })
                                                    }
                                                }
                                            }, 'Добавить')
                                        )
                                    )

                                ),
                                placement: 'bottom',
                                //title:'Синхронизация\u00a0входящих', 
                                html: true
                            })
                            if (d.length) {
                                let syncEd = 0;
                                d.forEach(function(ss) {

                                    cont1.appendChild(crEl('h5', ss.login));
                                    let list = crEl('div', { c: 'list-group' });

                                    ss.calendars.forEach(function(cal) {
                                        list.appendChild(crEl('a', {
                                            href: 'javascript:void(0)',
                                            title: (!(cal.watcher_resource_id && cal.watcher_resource_id.length) ? 'Нажмите чтобы синхронизировать' : 'Нажмите чтобы  отменить синхронизацию'),
                                            s: 'white-space:nowrap',
                                            c: 'list-group-item',
                                            e: {
                                                click: function() {
                                                    this.disabled = true;
                                                    this.empty().appendChild(new app.constructor.InlinePreloader(((cal.watcher_resource_id && cal.watcher_resource_id.length) ? 'Отключение синхронизации' : 'Включение синхронизации') + '...'))
                                                    app.modules.use('app.profile.integrations.service')
                                                        .then(function() {
                                                            app.profile.integrations.service.calendars.sync(cal, function(res, is) {
                                                                app.msg("Синхронизация календаря \"" + cal.name + "\" " + (is ? 'Включена' : 'Отключена'), 'success')
                                                                getServiceStatus(true);
                                                            })
                                                        })
                                                }
                                            }
                                        }, (cal.watcher_resource_id && cal.watcher_resource_id.length) ? crEl('span', { c: 'label label-info pull-right' }, 'Синхр.') : crEl('span', { c: 'label label-warning pull-right' }, 'Не синхр.'), cal.name))
                                        if (cal.watcher_resource_id && cal.watcher_resource_id.length) {
                                            syncEd++;
                                        }
                                    })

                                    list.appendChild(crEl('a', {
                                        href: 'javascript:void(0)',
                                        s: 'white-space:nowrap',
                                        c: 'list-group-item text-muted text-center',
                                        e: {
                                            click: function() {
                                                app.modules.use('app.profile.integrations.service')
                                                    .then(function() {
                                                        app.profile.integrations.service.calendars.add(+ss.id_service,
                                                                function(re) {
                                                                    console.log(re)
                                                                    app.msg("Календарь добавлен", 'success')
                                                                    getServiceStatus(true);
                                                                }
                                                            )
                                                            //
                                                    })
                                            }
                                        }
                                    }, new MIcon('add', { c: 'md-18 pull-left' }), "Добавить календарь"))

                                    cont1.appendChild(list);

                                    /*
                                    	app.modules.use('app.profile.integrations.service')
                                    	.then(function(){
                                    		app.profile.integrations.service.mail.toggleSync(+ss.id_service, ss,
                                    			function(re){
                                    				console.log(re)
                                    				app.msg("Синхронизация акаунта \""+ ss.login +"\" " + (re?"включена":"отключена"),'success')
                                    				getServiceStatus(true);
                                    			}
                                    		)
                                    		//
                                    	})	
                                    */
                                })

                                if (syncEd > 0) {
                                    label.innerHTML = "Sync with " + syncEd + '\u00a0' + declOfNum(syncEd, ['calendar', 'calendars', 'calendars']); //" calendar(s)."
                                }

                            } else {
                                cont1.appendChild(crEl('a', { href: 'javascript:void(0)', e: { click: function() { document.getElementById("addAccButn").click() } }, c: 'list-group-item disabled' }, 'Добавьте аккаунт для\u00a0синхронизации'))
                            }

                            inboxHeaderCaption.appendChild(label)

                            if (is_show_popup) {
                                $(label).popover('show')
                            }

                        });

                }

                getServiceStatus();




            }





            $('.list-item__footer-re-toolbar-checkitem').tooltip({
                html: true,
                placement: 'bottom'
            })

            app.timer.init()
        })










    },


    /**
     * Вывод подробной информации по выбранной задаче в списке
     * @methos app.tasks.oneToList
     * @param {Number} id Идентификатор задачи
     */

    oneToList: function(id, cb, container) {
        container = container || app.el.pageContent;
        let contacts = [];
        var taskContainer = container.querySelector(".task[data-id='" + id + "']");
        if (!taskContainer) { console.error('taskContainer is not defined'); return false; }
        var taskBody = taskContainer.querySelector('.list-item__body'),
            toolbar = taskBody.querySelector('.list-item__body-toolbar'),
            photo = taskBody.querySelector('.list-item__body-photo'),
            info = taskBody.querySelector('.list-item__body-info'),
            description = taskBody.querySelector('.list-item__body-description'),
            attachments = taskBody.querySelector('.list-item__body-attachments'),
            comments = taskContainer.querySelector('.list-item__comments'),
            footer = taskContainer.querySelector('.list-item__footer');




        $("html, body").stop().animate({ scrollTop: $(taskContainer).offset().top - 150 }, '200', 'swing');


        app.fetch(app.root + "ajax/task_base_info.php", { id: id }).then(function(d) {

            photo.empty();
            info.empty();

            photo.appendChild(new app.constructor.Avatar(d.cphoto, d.cname, { width: 40, height: 40, c: 'img-circle avatar', d: { key: 'contact_photo' } }));

            info.appendChild(crEl('a', {
                c: 'pull-right task-deadline',
                title: 'Срок',
                href: nav(),
                d: { key: 'deadline' },
                onclick: function() {
                    console.log('d', d)
                    if (d.markcomplete == 0 && d.access.f_write == 1) {
                        app.modules.use('app.tasks.deadline').then(function() { app.tasks.deadlineEdit(d); })
                    } else {
                        app.msg('Нет доступа к изменению срока', 'error').then(noty => {
                            noty.addAction('Подробнее', () => {
                                app.navigate('tasks/' + d.id + '/edit#access')
                            })
                        })
                    }
                }
            }, d.fdeadline + (d.meeting == 1 ? '\u00a0' + new Date(d.deadline * 1000).toTimeString().substr(0, 5) : '')))

            var dateStart = new Date(d.date * 1000),
                dateStartDisplay;
            dateStartDisplay = dateStart.getHours() === 0 ? dateStart.toLocaleDateString() : dateStart.toLocaleString().slice(0, -3);
            info.append(
                crEl('a', {
                    title: 'Дата начала' + (d.plane_deadline ? ('\nПлановый срок: ' + d.plane_deadline) : ''),
                    href: nav(),
                    onclick: function() {
                        app.modules.use('app.tasks.date').then(function() {
                            app.tasks.dateEdit(d, function() {
                                app.msg('Дата задачи изменена')
                            })
                        })
                    },
                    c: 'pull-right task-deadline',
                    d: { key: 'date_start' }
                }, dateStartDisplay)
            )


            if (!d.id_service_calendar && d.meeting && d.meeting == 1) {
                info.appendChild(crEl('a', {
                    c: 'pull-right',
                    href: 'javascript:void(0)',
                    e: {
                        click: function() {
                            let th = this;
                            app.fetch(app.root + 'ajax/service_calendar_is_one.php')
                                .then(function(res) {
                                    if (res && res.id > 0) {
                                        id_cal = res.id;
                                        app.msg(id_cal + '___');
                                        th.innerHTML = 'Загрузка...'
                                        app.modules.use('app.google')
                                            .then(function() {
                                                let scopes = ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar']
                                                _sync = function(res) {
                                                    app.google.errorHook(res, scopes, _sync)
                                                    if (res && res.error) { app.error(res.error); return false; }
                                                    if (res && res.success) {
                                                        app.msg("Встреча добавлена в календарь", "success");
                                                        console.info(res)
                                                        th.innerHTML = 'ok'
                                                    }
                                                }
                                                app.google.login(+res.id_service, scopes)
                                                    .then(function() {
                                                        app.fetch(app.root + 'ajax/gmail/calendars_task_to_event.php', { id_task: id, id_calendar: id_cal }, 'POST')
                                                            .then(_sync)
                                                    })
                                            })


                                    } else {
                                        app.msg('Не удалось найти календарь для синхронизации')
                                    }
                                })

                        }
                    }
                }, "Синхронизировать встречу"))
            } else if (d.calendar_event && d.calendar_event.id_service) {

                info.appendChild(crEl('a', {
                    c: 'pull-right',
                    href: 'javascript:void(0)',
                    e: {
                        click: function() {
                            let th = this;
                            th.innerHTML = 'Загрузка...'
                            app.modules.use('app.google')
                                .then(function() {
                                    let scopes = ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar']
                                    _sync = function(res) {
                                        app.google.errorHook(res, scopes, _sync)
                                        if (res && res.error) { app.error(res.error); return false; }
                                        if (res && res.success) {
                                            app.msg("Встреча синхронизирована с календарем", "success");
                                            console.info(res)
                                            th.innerHTML = '✓'
                                        }
                                    }
                                    app.google.login(+d.calendar_event.id_service, scopes)
                                        .then(function() {
                                            app.fetch(app.root + 'ajax/gmail/calendar_set_updates.php', { id_task: id }, 'POST')
                                                .then(_sync)
                                        })
                                })
                        }
                    },
                    s: 'display:inline-block; padding:8px;',
                    title: 'Синхронизировать данные с  календарем'
                }, "↺"))

            }

            info.appendChild(crEl('div',
                crEl('a', { href: 'javascript:void(0)', c: 'task-contact', d: { key: 'contact_name' } }, new app.constructor.ContactInline(d.cname, { id: d.cid, name: d.cname }, 'click'))
            ))

            
            

            description.innerHTML = d.description; //app.tools.collapseEmailSignature
            /*
                       
                        crEl('br'),
                        crEl('a',{href:'javascript:void(0)', c:'task-project'}, d.pname),' \u00a0 ',
                        crEl('span',{s:'color:#'+ d.scolor}, new Icon('fa-stop') ),'\u00a0',
                        crEl('a',{href:'javascript:void(0)', c:'task-project'}, crEl('small', d.sname))

            */

            //if( d.atta_count > 0 ) {
            attachments.empty();
            app.fetch(app.root + 'ajax/task_load_related_files_info.php', { id: id }).then(function(attach) {
                attach.forEach(function(k) {
                    var atta = new app.constructor.Attachment(k, true, function(el) {
                        if (!confirm('Удалить ' + k.name)) { return false; }
                        app.tasks.attachments.delete(d.id, k.id, function() {
                            console.log(el)
                            $(atta).remove();
                        })

                    })
                    attachments.appendChild(atta);
                })




            });



            //}

            if (d.comments_count > 0) {
                comments.empty();
                app.fetch(app.root + 'ajax/task.comments.load.php', { tid: id, desc: 0 }).then(function(comm) {
                    if (comm.length > 3) {
                        comments.appendChild(crEl('div', { c: 'comments-collapser' },
                            crEl('a', {
                                c: 'comments-collapser__btn',
                                e: {
                                    click: function() {
                                        $(this).hide()
                                        var i = 3;
                                        var list = this.parentNode.parentNode.querySelectorAll('.list-item__comments--collapsed');

                                        if (list && list.length) {
                                            $(this).show()
                                            this.animate('bounce')

                                            var cur = parseInt(this.innerHTML);
                                            this.innerHTML = (cur - 3).toString();
                                            if (cur <= 3) { this.parentNode.remove() }

                                            var j = 3;
                                            for (i = list.length - 1; i >= 0; i--) {
                                                if (j > 0) {
                                                    list[i].classList.remove('list-item__comments--collapsed')
                                                    list[i].animate('zoomIn');
                                                }
                                                j--;
                                            }
                                        }


                                    }
                                }
                            }, (comm.length - 3).toString())
                        ));
                    }
                    for (i = 0; i < comm.length; i++) {
                        var comment = new app.tasks.constructor.Comment(comm[i], id);
                        if (i < comm.length - 3) { comment.classList.add('list-item__comments--collapsed') }
                        comments.appendChild(comment);
                    }



                })
            } //comments count

            if (footer && (!footer.childNodes || !footer.childNodes.length)) {
                let block = crEl('div', {c: 'msginfo'});
		        let wrapper = crEl('div', {c: 'contactswrapper'});
                block.appendChild(new app.constructor.AddContactInput(contacts, d.id, wrapper));
                block.appendChild(wrapper);

                footer.appendChild(block);
                
                let mycontact = 0;
                if (typeof(d.mycontact) !== 'undefined') {
                    mycontact = d.mycontact;
                }

                if (d.cid > 0 && d.cid !== mycontact) {
                    wrapper.appendChild(new app.constructor.ContactElement(contacts, d.cid, d.cname));
                    contacts.push(parseInt(d.cid));
                }

                d.contacts_more.forEach((item, i, arr) => {
                    if (item.id > 0 && item.id !== mycontact) {
                        wrapper.appendChild(new app.constructor.ContactElement(contacts, item.id, item.name));
                        contacts.push(parseInt(item.id));
                    }
                });

                if (typeof(d.assignee_contact) !== 'undefined' && d.assignee_contact.id != mycontact) {
                    wrapper.appendChild(new app.constructor.ContactElement(contacts, d.assignee_contact.id, d.assignee_contact.name));
                    contacts.push(parseInt(d.assignee_contact.id));
                }

                let re = new app.constructor.taskRe();
                re.init(id, { placeholder: 'Ответить', caption: 'Ответить' }, function(res) {
                    console.log(res)
                        /*
                        	files
                        	id_timesheet
                        	is_bug
                        	is_email
                        	is_timesheet
                        	text
                        */
                    let data = {
                        tid: id,
                        comment: res.text,
                        tomail: res.is_email ? 1 : 0,
                        mid: 0,
                        tsid: res.is_timesheet ? res.id_timesheet : 0,
                        is_bug: res.is_bug ? 1 : 0,
                        callback: function() {
                            re.editor.empty();
                            setTimeout(function() { re.editor.focus() }, 1);
                        },
                        attach: res.files,
                        contacts
                    }



                    app.tasks.comments.add(data, re.dom.querySelector('.task-re__checkbox-toemail'), re.editor)

                });
                $(re.dom).hide();
                footer.appendChild(re.dom)
                footer.appendChild(crEl('div', {
                    contenteditable: 'true',
                    c: 'fantom-editor',
                    e: {
                        focus: function() {
                            $(re.dom).show();
                            re.editor.focus()
                            this.parentNode.classList.add('list-item__footer--active');
                            $(this).hide()
                        }
                    }
                }, 'Ответить'))
            }



            if (typeof(cb) === 'function') { cb() }


        })
    },


    /**
     * Задачи
     * @class app.tasks.comments
     * @memberof app.tasks
     * @instance
     * @private
     */
    attachments: {
        delete: function(id_task, id_file, callback) {
            app.fetch(app.root + 'files/task_attach_delete.php', { id_task: id_task, id_file: id_file }, 'POST')
                .then(function(res) {
                    if (res && res.success) {
                        if (typeof(callback) == 'function') {
                            callback()
                        } else {
                            app.error(d.error)
                        }
                    }
                })
        }
    },
    comments: {
        add: function(data, checboxIsEmail, editor) {
            let listfiles = null;
            if (app.el.pageContent.querySelector(".task[data-id='" + data.tid + "']")) {
                listfiles = app.el.pageContent.querySelector(".task[data-id='" + data.tid + "']").querySelector('.list-files');
            }

            app.currentEditind = null;

            data.is_state = data.f_state || 0;

            if (data.tomail) { // если с отправкой на email
                if (checboxIsEmail) { checboxIsEmail.classList.add('active'); }
                if (editor) {
                    editor.innerHTML =
                        '<div style="opacity:0.3; color:#1ab394">Идёт отправка сообщения... <br>' +
                        '<small>(' + checboxIsEmail.dataset.contactsText + ')</small>';
                }


                let sendEmailData = { text: data.comment, id_task: data.tid, attach: data.attach };

                if (typeof data.contacts !== 'undefined' && data.contacts.length > 0) {
                    sendEmailData.contacts = data.contacts;
                }

                if (data && data.tsid) { sendEmailData.id_timesheet = data.tsid }
                app.sendEmail(sendEmailData).then(function(d) {
                    if (d.id) {
                        data.mid = d.id;
                        var el = app.el.pageContent.querySelector(".task[data-id='" + data.tid + "'] .list-item__comments");
                        if (!el) { return }
                        el.appendChild(new app.tasks.constructor.Comment({
                            flags: {
                                bug: data.is_bug,
                                deadline: 0,
                                email: 1,
                                state: data.f_state || 0
                            },
                            files: d.files || [],
                            comment: { content: data.comment, fdate: d.time, ffdate: new Date().toString() },
                            user: JSON.parse(ls.get('user'))

                        }));

                        if (checboxIsEmail) { checboxIsEmail.classList.remove('active'); }
                        if (editor) {
                            editor.empty();
                        }


                        if (listfiles) { listfiles.empty() }

                        if (typeof data.callback === 'function') { data.callback() }

                    }
                }).catch(x => {
                    let div = crEl('p');
                    div.innerHTML = x;
                    app.confirm(crEl('div', div, 'Добавить комментарий без отправки на e-mail?')).then(() => {
                        data.email = 0;
                        app.fetch(app.root + 'ajax/task.comment.save.php', data, 'POST').then(function(d) {
                            if (!d) { app.error('Неизвестная ошибка'); return false; }
                            if (d.error) { app.error(d.error); return false; }
                            if (d.success) {

                                app.sendQueue()

                                if (app.el.pageContent.querySelector(".task[data-id='" + data.tid + "']")) {
                                    var el = app.el.pageContent.querySelector(".task[data-id='" + data.tid + "'].list-item--open");
                                    if (el) {
                                        el = el.querySelector('.list-item__comments');
                                        if (!el) { return }
                                        el.appendChild(new app.tasks.constructor.Comment({
                                            flags: {
                                                bug: data.is_bug,
                                                deadline: 0,
                                                email: data.tomail,
                                                state: data.f_state || 0
                                            },
                                            comment: { content: data.comment, fdate: d.time, ffdate: new Date().toString() },
                                            files: d.attachs,
                                            user: JSON.parse(ls.get('user'))

                                        }));
                                    }
                                }
                                if (listfiles) { listfiles.empty() }
                                if (typeof data.callback === 'function') { data.callback() }
                            }
                        }, "json")
                    }).catch(() => {

                    });
                })
            } else {
                app.fetch(app.root + 'ajax/task.comment.save.php', data, 'POST').then(function(d) {
                    if (!d) { app.error('Неизвестная ошибка'); return false; }
                    if (d.error) { app.error(d.error); return false; }
                    if (d.success) {

                        app.sendQueue()

                        if (app.el.pageContent.querySelector(".task[data-id='" + data.tid + "']")) {
                            var el = app.el.pageContent.querySelector(".task[data-id='" + data.tid + "'].list-item--open");
                            if (el) {
                                el = el.querySelector('.list-item__comments');
                                if (!el) { return }
                                el.appendChild(new app.tasks.constructor.Comment({
                                    flags: {
                                        bug: data.is_bug,
                                        deadline: 0,
                                        email: data.tomail,
                                        state: data.f_state || 0
                                    },
                                    comment: { content: data.comment, fdate: d.time, ffdate: new Date().toString() },
                                    files: d.attachs,
                                    user: JSON.parse(ls.get('user'))

                                }));
                            }
                        }
                        if (listfiles) { listfiles.empty() }
                        if (typeof data.callback === 'function') { data.callback() }
                    }
                }, "json")
            }
        }
    },

    subtasksToggle: function(id_task, el, a) {
        console.log(id_task, el);
        el.classList.toggle('list-item--parrent-open');

        a.childNodes[0].innerHTML = el.classList.contains('list-item--parrent-open') ? 'keyboard_arrow_up' : 'keyboard_arrow_down';

        var subtasks = el.querySelector('.sutasks')
        if (!subtasks) {
            var subtasks = crEl('div', { c: 'sutasks' }, new app.constructor.InlinePreloader('Загрузка предзадач...'))
            el.appendChild(subtasks)
            app.fetch(app.root + 'ajax/tasks_headers_new.php', { mode: 'all', id_parent: id_task })
                .then(function(d) {
                    subtasks.innerHTML = '';
                    d.forEach(function(k) {
                        subtasks.appendChild(new app.constructor.Task(k))
                    })
                })
        }


        if (el.classList.contains('list-item--parrent-open')) {
            subtasks.style.display = '';
            subtasks.animate('fadeIn');
        } else {

            subtasks.style.display = 'none';
        }

    },
    delete: function(id_task, callback) {
        function delTask(id_task, confirmation, callback) {
            if (!confirmation) { var confirmation = 0; }
            app.fetch(app.root + "ajax/task.delete.php", { id_task: id_task, confirmation: confirmation }, "POST")
                .then(function(d) {
                    if (!d || d.error) { app.error(d ? d.error : 'Неизвестная ошибка') }
                    if (d.confMe) {
                        if (confirm("Задача имеет подзадачи (" + (d.confMe) + "). Хотите ли удалить подчинённые задачи?")) {
                            delTask(id_task, 1);
                        } else {
                            delTask(id_task, 2);
                        }
                        app.sendQueue()

                    } else {
                        if (typeof(callback) == 'function') { callback() }
                    }
                })
        } // end deltask


        app.fetch(app.root + "ajax/task_del_prepare.php", { id_task: id_task })
            .then(function(d) {
                if (!d) { app.error("Ошибка выполнения запроса"); return false; }
                if (d && d.length === 0) {
                    delTask(id_task, null, callback)
                } else {
                    app.modal({
                        id: 'delTaskDocMOdal',
                        title: 'Внимание! Связанные данные!',
                        body: crEl('div',
                            crEl("p", "Объект, который вы пытаетесь удалить связан с исходящими документами:"),
                            crEl('table', { c: 'table table-bordered table-condensed' },
                                crEl('thead',
                                    crEl("tr",
                                        crEl('th', "№пп"),
                                        crEl('th', "ID"),
                                        crEl('th', "Наименовнаие документа"),
                                        crEl('th', "\u00a0")
                                    )
                                ), crEl('tbody', { id: 'delTaskDocList' })
                            ),
                            crEl("p", "Если вы подтвердите удаление ", crEl('strong', { c: 'text-error' }, "документы будут удалены!"))
                        ),
                        buttons: [

                            crEl('button', {
                                c: 'btn',
                                e: {
                                    click: function() {
                                        this.close(true)
                                    }
                                }
                            }, 'Отмена'),
                            crEl('button', {
                                c: 'btn primary',
                                e: {
                                    click: function() {
                                        var th = this
                                        delTask(id_task, null, function() {
                                            th.close(true);
                                        })
                                    }
                                }
                            }, 'Удалить')
                        ]
                    }, function() {
                        var el = document.getElementById("delTaskDocList");
                        for (var i = 0, l = d.length; i < l; i++) {
                            el.appendChild(crEl('tr',
                                crEl('td', { c: 'align-right' }, (i + 1).toString()),
                                crEl('td', d[i].id),
                                crEl('td', crEl('i', { c: d[i].icon }), '\u00a0', d[i].name),
                                crEl('td', crEl('a', { target: '_blank', href: '#outbox-' + d[i].id }, crEl('i', { c: 'icon-external-link-sign no-underline' })))
                            ))
                        }
                    })
                }
            })

    },
    /**
     * Отрисовка измененения состояния
     * @param {Number} id_task Идентификатор задачи
     * @param {Object} data Данные о новом состоянии
     * @param {Number} data.id id routestate
     * @param {String} data.color e0e0e0
     * @param {String} data.name  Имя состояния
     * @param {Number} data.last 0 | 1
     * @param {Number} data.last 0 | 1
     */
    redrawState: function(id_task, data, autocomment) {
        let el = app.el.pageContent.querySelector(".task[data-id='" + id_task + "'] .task-state-container");

        [].forEach.call(app.el.pageContent.querySelectorAll(".task[data-id='" + id_task + "'] .task-state-container"), (el) => {
            if (el && el.parentNode) {
                el.parentNode.empty().append(new app.constructor.TaskState(id_task, data, autocomment));
            }
        });

        const taskparam = JSON.parse(ls.get('tasks_params'));
        const isgr = !!document.querySelector(".task-list-group-header[data-group='" + data.name + "']");
        [].forEach.call(app.el.pageContent.querySelectorAll(".task[data-id='" + id_task + "']"), (taskEl) => {
            if (taskEl) {
                taskEl.dataset.state = data.id;
                if (taskparam && taskparam.group && taskparam.group == 'state') {
                    if (taskEl.dataset.priority == 3) {
                        taskEl.dataset.groupName = data.name;
                        if (isgr) {
                            taskEl.animate('bounceOut')
                            let rm = $(taskEl).remove()
                            $(".task-list-group-header[data-group='" + data.name + "']").after(rm)
                            rm.animate('bounceIn')
                        }
                    } else {
                        let grtask = $(".task[data-group-name='" + data.name + "']");
                        taskEl.dataset.groupName = data.name;
                        if (grtask && grtask.length) {
                            taskEl.animate('bounceOut')
                            let rm = $(taskEl).remove()
                            $(grtask.eq(grtask.length - 1)).after(rm)
                            rm.animate('bounceIn')
                        }
                    }
                }



            }
        })



        if (ls.get('task_view_mode_all') === 'kanban') {
            console.log('Перерисовка канбана после изменения состояния')
            if (app.tasks.kanban && typeof(app.tasks.kanban.reload) === 'function') {
                app.tasks.kanban.reload(() => {
                    let el = app.el.pageContent.querySelector(".kanban-task[data-id='" + id_task + "']");
                    if (el) { el.animate('tada') }
                })
            } else {
                console.log('Не могу перерисовать канбан', app.tasks.kanban);
                app.tasks.load(() => {
                    let el = app.el.pageContent.querySelector(".kanban-task[data-id='" + id_task + "']");
                    if (el) { el.animate('tada') }
                })
            }
        }



    },

    changeState: function(id_task, id_routetstate, auto_comments_task, cb0) {
        if (!id_routetstate || !(id_routetstate > 0)) {
            app.error('Не передано состояние для изменения');
            return false;
        };

        app.fetch(app.root + "ajax/task.state.check_to_save.php", { id_routestate: id_routetstate, id_task: id_task }, 'POST')
            .then(function(d) {
                if (d.success) {
                    f(id_task, id_routetstate, auto_comments_task, cb0)
                } else {
                    if (d.error && d.can_fix) {

                    }

                    if (d.error && d.error == 'modules_required') {
                        let list = crEl('div', { id: 'changestateextmoduleslist' });
                        if (d.avail_modules && d.avail_modules.length) {
                            for (let i = 0, l = d.avail_modules.length; i < l; i++) {
                                list.appendChild(crEl('div', crEl('label', {},
                                    crEl('input', { type: 'checkbox', value: d.avail_modules[i].id }),
                                    '\u00a0\u00a0' + d.avail_modules[i].name
                                )))
                            }
                        } else {
                            list = crEl('div', { c: 'alert alert-error' }, "Возникла ошибка при получении списка доступных модулей. Изменение состояния невозможно.")
                        }

                        let modal = app.modal({
                            title: 'Модуль не опрелен',
                            id: 'esr42343erf43',
                            body: crEl('div',
                                crEl('p', 'Задачи данного типа нельзя завершать без указания модуля.'),
                                crEl('p', 'Пожалуйста отметьте модули в рамках которых велась работа над задачей:'),
                                list
                            ),
                            buttons: [
                                crEl('button', {
                                    c: 'btn',
                                    e: {
                                        click: function() {
                                            this.close(true)
                                        }
                                    }
                                }, 'Отмена'),
                                crEl('button', {
                                    c: 'btn btn-primary',
                                    e: {
                                        click: function() {

                                            let chks = list.querySelectorAll('input:checked');
                                            let tagsCount = chks.length;
                                            chks.forEach(function(ip) {
                                                app.fetch(app.root + 'ajax/task.tag.add.php', { taskid: id_task, tagid: +ip.value }, 'POST', 'text')
                                                    .then(function() {
                                                        tagsCount--;
                                                        if (tagsCount === 0) {
                                                            f(id_task, id_routetstate, auto_comments_task, cb0);
                                                        }
                                                    })
                                            })
                                            this.close(true);

                                        }
                                    }
                                }, 'Сохранить'),

                            ]
                        }, function() {
                            if (d.avail_modules.length === 1) {
                                $("#changestateextmoduleslist input[type='checkbox']").get(0).checked = true;
                            }
                        })
                    } else {
                        app.error('Ошибка изменения состояния. ' + d.error || '@')
                    }
                }

            });

        function f(id_task, id_routetstate, auto_comments_task, cb1) {
            console.log('CHANGE STATE ', id_task, id_routetstate, auto_comments_task)
            app.fetch(app.root + "ajax/task.state.save.php", { id_routestate: id_routetstate, id_task: id_task }, 'POST')
                .then(function(d) {
                    if (d && d.success) {
                        var launched_timer_id = parseInt(ls.get('running_task')) || 0; // ID запущенного тайцмера или 0
                        if (d.result == 'next') { // Изменение состояния на Следующее
                            app.msg("Состояние успешно изменено", "success"); //на <b>\""+new_state_obj.name+"\"</b>"
                            if (auto_comments_task) { app.tasks.reguestComment(id_task, false, d.type == 'meeting', d); }
                            if (typeof cb1 == 'function') { cb1() }

                            app.sendQueue()

                        } else if (d.result == 'finish') {

                            app.msg((d.type == 'meeting' ? 'Встреча ' : "Задача ") + (d.positive_completion ? 'завершена' : 'аннулирована'), "success");
                            if (launched_timer_id == id_task) {
                                ls.unset('running_task')
                                app.timer.stop(id_task);
                            }
                            if (auto_comments_task) { app.tasks.reguestComment(id_task, true, d.type == 'meeting', d); }
                            if (typeof(cb1) == 'function') { cb1() }
                        }
                    } else {
                        app.error(d.error)
                    }
                })
        }
    },
    reguestComment: function(id_task, is_finish, is_meeting, task_data) {

        $("#modalTaskReguestComment").remove();
        let contacts = [];
        console.log(task_data)
        var re = new app.constructor.taskRe();
        re.init(id_task, {
                btnCaption: 'Сохранить',
                placeholder: 'Опишите работу которая была вами проделана'
            }, function(res) {





                if (is_finish && is_meeting) {

                    var d = {}
                    var time_raw = (document.getElementById("qcT1").value).split(":");
                    var tH = parseInt(time_raw[0]) || 0;
                    var tM = parseInt(time_raw[1]) || 0;
                    da1 = new Date(task_data.date * 1000);;
                    da1.setHours(tH, tM, 0);
                    d.date = Math.round(da1.getTime() / 1000);


                    var time_raw = (document.getElementById("qcT2").value).split(":");
                    var teH = parseInt(time_raw[0]) || 0;
                    var teM = parseInt(time_raw[1]) || 0;
                    da2 = new Date(task_data.deadline * 1000);;
                    da2.setHours(teH, teM, 0);
                    d.deadline = Math.round(da2.getTime() / 1000)

                    d.id = id_task;

                    d.duration = (d.deadline - d.date) / 60 / 60;

                    app.fetch(app.root + "ajax/timesheet_by_meeting_autocorrect.php", { start: d.date, finish: d.deadline, id_task: id_task }, 'POST', 'text')
                    app.fetch(app.root + 'ajax/task_times_param_save.php', d, 'POST', 'text')

                }



                let fdd = document.getElementById("modalTaskReguestComment").dataset.deadline || 0

                let data = {
                    tid: id_task,
                    comment: res.text,
                    tomail: res.is_email ? 1 : 0,
                    mid: 0,
                    tsid: res.is_timesheet ? res.id_timesheet : 0,
                    id_timesheet: res.is_timesheet ? res.id_timesheet : 0,
                    is_bug: res.is_bug ? 1 : 0,
                    is_deadline: fdd,
                    f_deadline: fdd,
                    noccoment: 0,
                    f_state: 1,
                    callback: function() {
                        //document.getElementById("modalTaskReguestComment").close();	
                    },
                    attach: res.files,
                    contacts: contacts
                }

                document.getElementById("modalTaskReguestComment").close();

                app.tasks.comments.add(data, re.dom.querySelector('.task-re__checkbox-toemail'))





            })
            //re.dom.insertBefore(crEl('input'),re.dom.querySelector('.task-re__sendbtn'))
        var modalBody = crEl('div', re.dom);
        var timesheetEd = crEl('div');
        var timeparams = crEl('div');

        let block = crEl('div', {c: 'msginfo', s: {'margin-top': '10px'}});
        let wrapper = crEl('div', {c: 'contactswrapper'});
        block.appendChild(wrapper);
        block.appendChild(new app.constructor.AddContactInput(contacts, id_task, wrapper));

        app.fetch(app.root + "ajax/task_base_info.php", { id: id_task }).then(function(d) {
            let mycontact = 0;
            if (typeof(d.mycontact) !== 'undefined') {
                mycontact = d.mycontact;
            }
            if (d.cid > 0 && d.cid !== mycontact) {
                wrapper.appendChild(new app.constructor.ContactElement(contacts, d.cid, d.cname));
                contacts.push(parseInt(d.cid));
            }

            d.contacts_more.forEach((item, i, arr) => {
                if (item.id > 0 && item.id !== mycontact) {
                    wrapper.appendChild(new app.constructor.ContactElement(contacts, item.id, item.name));
                    contacts.push(parseInt(item.id));
                }
            });

            if (typeof(d.assignee_contact) !== 'undefined' && d.assignee_contact.id != mycontact) {
                wrapper.appendChild(new app.constructor.ContactElement(contacts, d.assignee_contact.id, d.assignee_contact.name));
                contacts.push(parseInt(d.assignee_contact.id));
            }
        });

        app.modal({
            title: 'Информация о проделанной работе' + (is_finish ? ' (Завершение)' : ''),
            id: 'modalTaskReguestComment',
            c: 'task-comment-dilaog',
            body: crEl('div',
                timeparams,
                crEl('div', { c: 'text-muted text-right', id: 'taskRequestCommentDeadline' }),
                modalBody,
                timesheetEd,
                block
            ),
            onhide: function(event) {

                if (app.currentEditind && app.currentEditind.length) {
                    app.msg('Есть несохраненные изменения');
                    document.querySelector('.task-re__editor').focus()
                    event.preventDefault();
                }


            }
        }).then(function() {
            re.editor.focus();
            if (is_finish && is_meeting) {
                timeparams.style.marginBottom = '20px';


                console.log(task_data);
                var d1 = new Date(task_data.date * 1000);
                var d2 = new Date(task_data.deadline * 1000);
                timeparams.appendChild(crEl('span', 'Встреча с \u00a0'));
                timeparams.appendChild(crEl('input', {
                    type: 'time',
                    id: 'qcT1',
                    value: d1.toTimeString().substr(0, 5),
                    e: {
                        change: function() {
                            let t1 = document.getElementById("qcT1");
                            let t2 = document.getElementById("qcT2");
                            let tr = document.getElementById("qcTr");
                            let ab = t1.value.split(':');
                            let ae = t2.value.split(':');
                            let ar = tr.value.split(':');
                            d1.setHours(+ab[0]);
                            d1.setMinutes(+ab[1]);
                            t2.value = new Date(d1.getTime() + (parseInt(ar[0]) * 60 * 60 * 1000 + parseInt(ar[1]) * 60 * 1000)).toTimeString().substr(0, 5)
                        }
                    }
                }))
                timeparams.appendChild(crEl('span', '\u00a0 до \u00a0'))

                console.log(d2)

                timeparams.appendChild(crEl('input', {
                    type: 'time',
                    id: 'qcT2',
                    value: d2.toTimeString().substr(0, 5),
                    e: {
                        change: function() {
                            let t1 = document.getElementById("qcT1");
                            let t2 = document.getElementById("qcT2");
                            let tr = document.getElementById("qcTr")
                            let ab = t1.value.split(':');
                            let ae = t2.value.split(':');
                            let ar = tr.value.split(':');
                            d2.setHours(+ae[0]);
                            d2.setMinutes(+ae[1]);
                            tr.value = new Date((d2 - d1) + (d1.getTimezoneOffset() * 60 * 1000)).toTimeString().substr(0, 5)
                        }
                    }
                }))
                timeparams.appendChild(crEl('span', '; \u00a0 Продолжительность:\u00a0'));
                timeparams.appendChild(crEl('input', {
                    type: 'time',
                    id: 'qcTr',
                    value: (new Date((d2 - d1) + (d1.getTimezoneOffset() * 60 * 1000))).toTimeString().substr(0, 5),
                    e: {
                        change: function() {
                            let t1 = document.getElementById("qcT1");
                            let t2 = document.getElementById("qcT2");
                            let tr = document.getElementById("qcTr")
                            let ab = t1.value.split(':');
                            let ae = t2.value.split(':');
                            let ar = tr.value.split(':');

                            t2.value = new Date(d1.getTime() + (parseInt(ar[0]) * 60 * 60 * 1000 + parseInt(ar[1]) * 60 * 1000)).toTimeString().substr(0, 5)
                        }
                    }
                }))

                document.getElementById("qcTr").focus()




            } else if (is_finish && !is_meeting) {
                function loadTs() {
                    timesheetEd.innerHTML = '<div style="text-align:center; opacity:0,5">Загрузка информации о затраченном времени...</div>';
                    app.fetch(app.root + 'ajax/durationExt.php', { id: id_task, my: 1 })
                        .then(function(d) {
                            if (d.error) { timesheetEd.innerHTML = "Ошибка<pre>" + d.error; return false; }
                            if (d.items && d.items.length === 0) { timesheetEd.innerHTML = '<div class="alert alert-info">Нет данных о времени затраченном на эту задачу.</div>'; }

                            timesheetEd.innerHTML = '';
                            timesheetEd.style.marginTop = '20px';
                            timesheetEd.appendChild(crEl('div', crEl('strong', 'Затраты времени')))
                            if (d.items.length > 0) {
                                let tbody = crEl('tbody')
                                let summ = 0;
                                var Tr = function(data) {
                                    let d1 = new Date(data.start_unix * 1000)
                                    let d2 = new Date(data.finish_unix * 1000)
                                    return crEl('tr', {
                                            s: 'cursor:pointer',
                                            title: 'Выбрать запись для редактирования',
                                            e: {
                                                click: function() {
                                                    app.modules.use('app.timesheet.edit')
                                                        .then(function() {
                                                            app.timesheet.edit(id_task, data, function() {
                                                                $('#tadiAddTimesheetRowDialog').modal('hide');
                                                                loadTs()
                                                            }, function() {
                                                                $("#modalTaskReguestComment").modal('hide');
                                                                $('#tadiAddTimesheetRowDialog').on('hidden.bs.modal', function(e) {
                                                                    $("#modalTaskReguestComment").modal('show');
                                                                    loadTs()
                                                                })
                                                            })
                                                        })
                                                }
                                            }
                                        },
                                        crEl('td', crEl('span', { s: 'opacity:0.8' }, d1.toLocaleDateString()), '\u00a0', d1.toTimeString().substr(0, 5)),
                                        crEl('td', crEl('span', { s: 'opacity:0.8' }, d1.toLocaleDateString()), '\u00a0', d2.toTimeString().substr(0, 5)),
                                        crEl('td', (data.durat / 60).toFixed(2).toString() + '\u00a0ч.')
                                    );
                                }


                                for (i = 0; i < d.items.length; i++) {
                                    tbody.appendChild(new Tr(d.items[i]));
                                    summ += parseFloat(d.items[i].durat);
                                }


                                timesheetEd.appendChild(crEl('div', { s: 'max-height:300px; overflow-y:auto;' }, crEl('table', { c: 'table table-striped table-condensed table-hover' },
                                    crEl('thead',
                                        crEl('tr',
                                            crEl('th', 'Начало'),
                                            crEl('th', 'Завершение'),
                                            crEl('th', 'Продолж.')
                                        )
                                    ),
                                    tbody,
                                    crEl('tfoot',
                                        crEl('tr',
                                            crEl('td', { colspan: 2, style: 'text-align:right' },
                                                crEl('button', {
                                                    c: 'btn btn-xs btn btn-primary btn-bitbucket pull-left',
                                                    e: {
                                                        click: function() {
                                                            app.modules.use('app.timesheet.edit')
                                                                .then(function() {
                                                                    app.timesheet.edit(id_task, null, function() {
                                                                        $('#tadiAddTimesheetRowDialog').modal('hide');
                                                                    }, function() {
                                                                        loadTs()
                                                                        $("#modalTaskReguestComment").modal('hide');
                                                                        $('#tadiAddTimesheetRowDialog').on('hidden.bs.modal', function(e) {
                                                                            $("#modalTaskReguestComment").modal('show');
                                                                        })
                                                                    })
                                                                })
                                                        }
                                                    },
                                                    title: 'Добавить запись о времени'
                                                }, crEl('b', "\u00a0+\u00a0")),
                                                'Итого:'),
                                            crEl('td', {}, (summ / 60).toFixed(2) + '\u00a0ч.')
                                        )
                                    )

                                )))

                            }

                            //timesheetEd.appendChild()


                        })
                }

                loadTs()
            }

            app.fetch(app.root + 'ajax/task_get_param.php?id=' + id_task + '&fields=id,date,deadline,id_assignee').then(function(resd) {
                if (resd) {
                    resd.assignee_id = resd.id_assignee;
                    document.getElementById("taskRequestCommentDeadline").empty().append(crEl('small',
                        crEl('span', 'Текущий срок задачи '),
                        crEl('a', {
                            href: nav(),
                            d: { key: 'deadline' },
                            onclick: function() {
                                let th = this;
                                app.modules.use('app.tasks.deadline').then(() => {
                                    if (th.dataset.deadline) { resd.deadline = +th.dataset.deadline }
                                    app.tasks.deadlineEdit(resd, function(rd) {
                                        th.dataset.deadline = rd.deadline;
                                        th.innerText = new Date(rd.deadline * 1000).toLocaleDateString();
                                        th.animate('flipInX')
                                        document.getElementById("modalTaskReguestComment").dataset.deadline = 1

                                    }, { requireComment: false })
                                })
                            }
                        }, new Date(resd.deadline * 1000).toLocaleDateString())
                    )).animate('flipInX')
                }
            })

        })
    },

    modalComment: function(title, placeholder, callback, checkbox, checkbox_title, checkbox2, checkbox2_title, time_corrector, onCreateCallback) {

        var re = new app.constructor.taskRe();
        re.init(20006, {}, function(res) {
            console.log(res)
        })

        var modalBody = crEl('div', re.dom);

        app.modal({
            title: 'заметка о проделанной работе',
            c: 'task-comment-dilaog',
            body: crEl('div',

                modalBody
            ),
            onhide: function(event) {
                console.log('modal hide')
            }
        }).then(function() {

        })
    },
    timer: {},
    configureOne: function(id_task) {},

    filters1: {
        list: {}, //app.tasks.filters.list
        set: function(name, value) {
            if (!value) {
                this.list[name] = null;
            } else if (value instanceof Array) {
                this.list[name] = value.length ? value.join(',') : null;
            } else {
                this.list[name] = value;
            }
        },
        get: function(name) {
            if (!this.list[name]) { return false; }
            return this.list[name].indexOf(',') != -1 ? this.list[name].split(',') : this.list[name];
        },

        getFromUrl: function(params) {
            for (let k in params) {
                this.set(k, params[k])
            }
        },

        setToUrl: function() {
            let sch = [];
            for (let k in this.list) {
                if (this.list[k]) sch.push(k + '=' + (this.list[k])); //encodeURIComponent
            }
            history.pushState(this.list, document.title, ('tasks/' + app.tasks.mode) + (sch.length ? '?' + sch.join('&') : ''));
            return (sch.length ? sch.join('&') : '');
        },

        init: function() {
            let mBody = crEl('div');


            app.el.rightSidebar.empty()
            app.el.rightSidebar.open()
            app.el.rightSidebar.appendChild(mBody)





            let params = { mode: app.tasks.mode, user: 0 }
            for (let k in app.tasks.filters.list) {
                if (app.tasks.filters.list[k] && k === 'assignee') { params[k] = app.tasks.filters.get(k); }
            }
            app.fetch(app.root + 'ajax/tasks_menu.php', params).then((res) => {

                mBody.empty();

                let projects = crEl('ul', { c: 'tag-list' }),
                    tags = crEl('ul', { c: 'tag-list' }),
                    assignees = crEl('ul', { c: 'tag-list' }),
                    contacts = crEl('ul', { c: 'tag-list' });

                let qInp = new Inp({ p: 'Поиск по задачам', t: 'search', c: 'form-control' }),
                    pInp = new Inp({ p: 'Выбрать проект', c: 'form-control' }),
                    tInp = new Inp({ p: 'Выбрать тег', c: 'form-control' }),
                    aInp = new Inp({ p: 'Выбрать исполнителя', c: 'form-control' }),
                    cInp = new Inp({ p: 'Выбрать контакт', c: 'form-control' }),
                    dInp = new Inp({ c: 'form-control', p: 'Выбрать даты' })

                let pSel = crEl('select', { id: 'tasksFilterPriority' }, { c: 'form-control' }),
                    sSel = crEl('select', { id: 'tasksFilterState' }, { c: 'form-control' })

                mBody.appendChild(crEl('div', { c: 'tabs-container' },

                    crEl('ul', { c: 'nav nav-tabs navs-1' },
                        crEl('a', { href: 'javascript:app.el.rightSidebar.close()', c: 'pull-right close', s: 'margin:8px 4px' }, new MIcon('close')),
                        crEl('li', { c: 'active' }, crEl('a', { d: { toggle: 'tab' }, href: '#tasksFilterGeneral' }, 'Основные')),
                        crEl('li', crEl('a', { d: { toggle: 'tab' }, href: '#tasksFilterExt' }, 'Дополнительные'))
                    ),
                    crEl('div', { c: 'tab-content' },
                        crEl('div', { id: 'tasksFilterGeneral', c: 'tab-pane active', s: 'padding:8px 16px' },
                            crEl('div', { c: 'form-group  m-t-sm' },
                                crEl('label', 'Найти'),
                                qInp
                            ),

                            crEl('div', { c: 'hr-line-dashed' }),

                            crEl('div', { c: 'form-group' },
                                crEl('label', { s: 'display:block' }, 'Исполнитель'),
                                aInp, assignees
                            ),

                            crEl('div', { c: 'form-group' },
                                crEl('label', { s: 'display:block' }, 'Контактное лицо'),
                                cInp, contacts
                            ),

                            crEl('div', { c: 'form-group' },
                                crEl('label', { s: 'display:block' }, 'Проекты'),
                                pInp, projects
                            ),



                            crEl('div', { c: 'form-group' },
                                crEl('label', { s: 'display:block' }, 'Теги'),
                                tInp, tags
                            ),
                            crEl('div', { c: 'hr-line-dashed' }),
                            crEl('div', { c: 'form-group' },
                                crEl('label', 'Приоритет'),
                                pSel
                            ),
                            crEl('div', { c: 'form-group' },
                                crEl('label', 'Состояние'),
                                sSel
                            )
                        ),
                        crEl('div', { id: 'tasksFilterExt', c: 'tab-pane', s: 'padding:8px 16px' },
                            crEl('div', { c: 'form-group m-t-sm' },
                                crEl('label', 'Архивные'),
                                crEl('select', { id: 'contactFilterArchive' }, { c: 'form-control' },
                                    crEl('option', { value: 0 }, 'Не показывать архивные'),
                                    crEl('option', { value: 1 }, 'Только архивные'),
                                    crEl('option', { value: 2 }, 'Все включая архивные')
                                )
                            ),
                            crEl('div', { c: 'form-group' },
                                crEl('label', 'Дата'),
                                crEl('span', {
                                    c: 'close pull-right',
                                    e: {
                                        click: () => {
                                            dInp.value = ''
                                            dInp.dataset.start = null;
                                            dInp.dataset.finish = null;
                                        }
                                    }
                                }, new MIcon('close')), dInp
                            ),
                            crEl('div', { c: 'form-group m-t-sm' },
                                crEl('label', 'Тип даты'),
                                crEl('select', { id: 'tasksFilterArchiveDateType' }, { c: 'form-control' },
                                    crEl('option', { value: 'date_create' }, 'Дата создания'),
                                    crEl('option', { value: 'date' }, 'Дата начала'),
                                    crEl('option', { value: 'deadline' }, 'Срок'),
                                    crEl('option', { value: 'date_complete' }, 'Дата завершения')
                                )
                            )
                        )
                    ),



                    crEl('div', { c: 'row-fluid', s: 'padding:8px 16px' },
                        crEl('button', { c: 'btn btn-primary col-xs-6 m-r-xs', id: 'ctsFilterApply', e: { click: function() {} } }, 'Применить'),
                        crEl('button', {
                            c: 'btn btn-white col-xs-5',
                            e: {
                                click: function() {

                                    app.tasks.filters.list = {};
                                    app.tasks.filters.setToUrl();
                                    app.tasks.init(app.tasks.mode, '');
                                    app.el.rightSidebar.close()

                                }
                            }
                        }, 'Очистить')
                    )
                ))

                function floatApplyInit(e) {
                    /*	app.msg('Изменен фильтр').then((noty)=>{
                    		noty.addAction('Применить фильтр',()=>{
                    			document.getElementById("ctsFilterApply").click()
                    		})
                    	});*/

                    let inpPos = e.target.getBoundingClientRect();
                    let btn = crEl('button', {
                        s: { top: (inpPos.top + 2) + 'px', left: (inpPos.left - 112) + 'px', position: 'fixed' },
                        onclick: function() {
                            document.getElementById("ctsFilterApply").click();
                            this.parentNode.removeChild(this);
                        },
                        c: 'btn btn-sm btn-info filter-float-btn'
                    }, 'Применить');
                    e.target.parentNode.appendChild(btn);
                    btn.animate('bounceIn')
                    setTimeout(() => {
                        btn.animate('fadeOut', () => { btn.parentNode.removeChild(btn); });
                    }, 1600)
                }
                new Array(qInp, pInp, tInp, aInp, cInp, dInp, pSel, sSel).forEach((i) => {
                    i.removeEventListener('change', floatApplyInit);
                    i.addEventListener('change', floatApplyInit);
                })




                app.modules.use('fnn-autocomplete')
                    .then(function() {

                        function initAutocomplete(inp, list, data) {
                            return new fnnAutocomplete(inp, {
                                minLength: 1,
                                autoOpen: true,
                                limit: 7,
                                key: 'name',
                                closeBtn: false,
                                data: data,
                                render: function(d) {
                                    return crEl('li', { s: 'padding:4px 8px;' }, crEl('span', { c: 'badge pull-right' }, d.count.toString()), d.name)
                                },
                                onSelect: function(res) {
                                    let ex = list.querySelector("[data-id='" + res.id + "']");
                                    if (ex) {
                                        app.msg("Уже есть")
                                        ex.animate('bounceIn');

                                    } else {

                                        let el = new Fi(res);
                                        list.appendChild(el);
                                        el.animate('fadeInUp');
                                        inp.dispatchEvent(new Event('change'));
                                    }
                                    inp.value = '';

                                }
                            })
                        }

                        initAutocomplete(aInp, assignees, res.filters.assignee);
                        initAutocomplete(pInp, projects, res.filters.projects);
                        initAutocomplete(tInp, tags, res.filters.tags);



                        new fnnAutocomplete(cInp, {
                            minLength: 1,
                            autoOpen: false,
                            key: 'name',
                            closeBtn: false,
                            limit: 7,
                            source: function(term, cb) {
                                app.fetch(app.root + 'ajax/autocomplete.contacts.forQickAddTask.php', { term: term })
                                    .then(function(d) { cb(d) })
                            },
                            onSelect: function(res) {
                                let ex = contacts.querySelector("[data-id='" + res.id + "']");
                                if (ex) {
                                    app.msg("Уже есть")
                                    ex.animate('bounceIn');

                                } else {

                                    let el = new Fi(res);
                                    contacts.appendChild(el);
                                    el.animate('fadeInUp');

                                }
                                cInp.value = '';
                                //cInp.dispatchEvent(new Event('change'));
                            }
                        })


                        return;
                    })


                if (res.groups) {
                    pSel.appendChild(crEl('option', { value: 0 }, 'Все'))
                    res.groups.priority.forEach((x) => { pSel.appendChild(crEl('option', { value: x.priority }, x.priority + '  (' + x.count + ')')); })

                    sSel.appendChild(crEl('option', { value: 0 }, 'Все'))
                    res.groups.states.forEach((x) => { sSel.appendChild(crEl('option', { value: x.id }, x.name + '  (' + x.count + ')')); })
                }

                let drp = null;
                app.modules.use('daterangepicker', function() {
                        drp = $(dInp).daterangepicker({
                            locale: {
                                format: 'DD.MM.YYYY',
                                separator: ' - ',
                                applyLabel: 'ОК',
                                cancelLabel: 'Отмена',
                                weekLabel: 'W',
                                customRangeLabel: 'Диапазон дат'
                            },
                            autoUpdateInput: false,
                            singleDatePicker: false,
                            ranges: {
                                'Сегодня': [moment(), moment()],
                                'Вчера': [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')],
                                'На этой неделе': [moment().startOf('week'), moment().endOf('week')],
                                'В этом месяце': [moment().startOf('month'), moment().endOf('month')],
                                'В этом году': [moment().startOf('year'), moment().endOf('year')]
                            }
                        }).on('apply.daterangepicker', function(a, picker) {
                            $(this).val(picker.startDate.format('DD.MM.YYYY') + ' - ' + picker.endDate.format('DD.MM.YYYY'));
                            this.dataset.start = Math.round(moment(picker.startDate).toDate().getTime() / 1000);
                            this.dataset.finish = Math.round(moment(picker.endDate).toDate().getTime() / 1000);

                        }).on('cancel.daterangepicker', function(ev, picker) {
                            $(this).val('');
                            dInp.dataset.start = null;
                            dInp.dataset.finish = null;
                        })
                    })
                    //period_mode


                function Fi(data, type) {
                    return crEl('li', { d: { id: data.id } },
                        crEl('a', { href: nav(), title: data.name, s: 'background-color: #1ab394; color:#fff' }, new MIcon('close', {
                            c: 'close',
                            e: {
                                click: function() {
                                    let el = this.parentNode.parentNode;
                                    el.animate('bounceOut', () => { el.remove(); })

                                    let inp = el.parentNode.parentNode.querySelector('input');
                                    if (inp) { inp.dispatchEvent(new Event('change')); }
                                }
                            }
                        }, '×'), compressFio(data.name, true), '\u00a0')
                    )

                }

                document.getElementById("ctsFilterApply").onclick = () => {

                    let al = [],
                        cl = [],
                        tl = [],
                        pl = [];
                    assignees.querySelectorAll('li').forEach((i) => { al.push(i.dataset.id); })
                    contacts.querySelectorAll('li').forEach((i) => { cl.push(i.dataset.id); })
                    tags.querySelectorAll('li').forEach((i) => { tl.push(i.dataset.id); })
                    projects.querySelectorAll('li').forEach((i) => { pl.push(i.dataset.id); })

                    app.tasks.filters.set('assignee', res.filters.assignee.length === al.length ? null : al);
                    app.tasks.filters.set('cid', res.filters.contacts.length === cl.length ? null : cl);
                    app.tasks.filters.set('pid', res.filters.projects.length === pl.length ? null : pl);
                    app.tasks.filters.set('tid', res.filters.tags.length === tl.length ? null : tl);



                    let period_b = dInp.dataset.start;
                    let period_e = dInp.dataset.finish;
                    let period_mode = (+period_b || +period_e) ? document.getElementById("tasksFilterArchiveDateType").value || 'date_create' : null;

                    app.tasks.filters.set('period_mode', period_mode);
                    app.tasks.filters.set('period_b', +period_b || null);
                    app.tasks.filters.set('period_e', +period_e || null);



                    let qv = qInp.value.trim();
                    app.tasks.filters.set('q', qv.length ? qv : null);


                    let pv = pSel.value;
                    app.tasks.filters.set('priority', pv > 0 ? pv : null);
                    let sv = sSel.value;
                    app.tasks.filters.set('sid', sv > 0 ? sv : null);

                    let av = document.getElementById("contactFilterArchive").value;
                    app.tasks.filters.set('archive', av > 0 ? av : null);

                    app.tasks.init(app.tasks.mode, app.tasks.filters.setToUrl());
                }


                //?jobs=19&contragents=73&projects=70&tags=115

                function getAById(id, arr) {
                    for (let i = 0; i < arr.length; i++) {
                        if (arr[i].id == id) { return arr[i]; }
                    }
                    console.info(id, arr)
                    return false;
                }

                for (let k in app.tasks.filters.list) {

                    if (!app.tasks.filters.get(k)) { continue; }
                    let v = app.tasks.filters.get(k) instanceof Array ? app.tasks.filters.get(k) : [app.tasks.filters.get(k)]
                    switch (k) {
                        case 'assignee':
                            if (v && v.length) v.forEach((a) => { assignees.appendChild(new Fi(getAById(a, res.filters.assignee))); })
                            break;

                        case 'cid':
                            if (v && v.length) {
                                app.fetch(app.root + 'ajax/autocomplete.contacts.forQickAddTask.php', { ids: v }).then((resc) => {
                                    v.forEach((a) => { contacts.appendChild(new Fi(getAById(a, resc))); });
                                })

                            }
                            break;

                        case 'pid':
                            if (v && v.length) v.forEach((a) => { projects.appendChild(new Fi(getAById(a, res.filters.projects))); })
                            break;

                        case 'tid':
                            if (v && v.length) v.forEach((a) => { tags.appendChild(new Fi(getAById(a, res.filters.tags))); })
                            break;

                        case 'priority':
                            if (v) { pSel.value = v; }
                            break;

                        case 'sid':
                            if (v) { sSel.value = v; }
                            break;



                        case 'q':
                            if (v) { qInp.value = v }

                            break;
                        case 'archive':
                            if (v) { document.getElementById("contactFilterArchive").value = v; }
                            break;


                        case 'period_mode':
                            if (v) { document.getElementById("tasksFilterArchiveDateType").value = v; }
                            break;
                        case 'period_b':
                            if (v) { dInp.dataset.start = v; }
                            break;
                        case 'period_e':
                            if (v) { dInp.dataset.finish = v; }
                            break;

                    }






                }

                if (dInp && dInp.dataset && dInp.dataset.start) {
                    //dInp.value = (new Date(dInp.dataset.start*1000).format('DD.MM.YYYY') + ' - ' + new Date(dInp.dataset.finish*1000).format('DD.MM.YYYY'));
                    setTimeout(() => {
                        $(dInp).data('daterangepicker').setStartDate(new Date(dInp.dataset.start * 1000));
                        $(dInp).data('daterangepicker').setEndDate(new Date(dInp.dataset.finish * 1000));
                        dInp.value = new Date(dInp.dataset.start * 1000).toLocaleDateString() + ' - ' + new Date(dInp.dataset.finish * 1000).toLocaleDateString()
                    }, 1000)

                }

            })


            /*									app.tasks.filters.set('q', v);
            						app.tasks.init(action, app.tasks.filters.setToUrl())*/


            mBody.empty().appendChild(new app.constructor.InlinePreloader('Загрузка фильтров. Пожалуйста подождите...'))

        }
    },



    updateTaskByKey: function(id_task, key, paramOrVal) {
        let els = app.el.pageContent.querySelectorAll(".task[data-id='" + id_task + "']");
        console.log('updt key', key, els);
        [].forEach.call(els, function(el) {
            if (el) {
                let elKey = el.querySelector("[data-key='" + key + "']");
                if (elKey) {
                    if (typeof paramOrVal === 'object') {
                        if (paramOrVal.src) {
                            app.tools.cnangeAvatarSrc(elKey, paramOrVal.src, paramOrVal.name)
                        } else {
                            for (let k in paramOrVal) {
                                elKey.setAttribute(k, paramOrVal[k]);
                            }
                        }
                    } else if (typeof paramOrVal === 'string') {
                        elKey.innerHTML = paramOrVal
                    }
                }
            }
        })
    }


}