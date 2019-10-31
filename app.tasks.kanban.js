//if(!app.tasks.mode){app.tasks = {}}
app.tasks.kanban = {

    load: function(d, taskContainer, params, callback) {

        app.tasks.kanban.reload = function(cb) {
            app.fetch(app.root + 'ajax/tasks_headers_new.php', params).then((nd) => {
                app.tasks.kanban.load(nd, taskContainer, params, function(x) {
                    if (typeof(cb) === 'function') { cb() }
                    callback(x)
                })
            })
        }


        if (d && d.length) {



            const deadlineNames = function(id) {
                const data = {
                    0: 'Просроченные на этой неделе',
                    1: 'Просроченные',
                    8: 'Завершенные',
                    7: 'В прошлом',
                    6: 'Не скоро',
                    5: 'В этом месяце',
                    4: 'На этой неделе',
                    3: 'Завтра',
                    2: 'Сегодня' //,
                        //1:	'Давно'
                };
                return data[id];
            }

            const priorityNames = function(id) {
                const data = {
                    1: 'Низкий приоритет',
                    2: 'Обычный приоритет',
                    3: 'Высокий приоритет'
                }
                return data[id];
            }

            function KBTask(data, parent) {
                let kbItem = crEl({
                        c: 'task kanban-task',
                        draggable: 'true',
                        d: {
                            id: data.id,
                            state: data.state_id,
                            priority: data.priority,
                            type: data.type,
                            daytype: data.daytype,
                            route: data.route,
                            meeting: data.meeting,
                            act: data.auto_comments_task
                        }
                    },
                    crEl('div', {c: 'task-header'},
                        crEl('a', {
                            href: nav(),
                            d: { key: 'name' },
                            onauxclick: function() { app.navigate('tasks/' + data.id, true) },
                            onclick: function(event) {


                                if (!event.ctrlKey) {
                                    app.modules.use('app.tasks.quickView').then(() => {
                                        app.tasks.quickView(data)
                                    })
                                } else {
                                    app.navigate('tasks/' + data.id, true)
                                }

                                kbItem.classList.remove('kanban-task-actual')


                            },
                            title: data.name
                        }, data.name)
                    ),
                    crEl('div', { c: 'kanban-task-footer' },
                        crEl('a', { c: 'task-timer-toggler pull-right', href: nav(), onclick: function() { app.timer.toggle(data.id); } }, new Icon('play-circle-o')),
                        crEl('a', { href: 'contacts/' + data.contact_id, s:'display:block'}, compressFio(data.contact_name)),
                        (app.user.id !== data.assignee_id && data.assignee_id != null)
                            && crEl('a', { href: 'users/' + data.assignee_id, c:'assignee', s:'display:block' }, compressFio(data.assignee_name)),
                        (data.assignee_id == null && data.role_id != null)
                            && crEl('span', { c:'role', s:'display:block' }, data.role_name),
                        (data.assignee_id == null && data.role_id == null)
                            && crEl('span', { c:'project', s:'display:block' }, data.project_name),
                    ),
                    crEl('div',{ c: 'dates'},
                        crEl('div', {
                            c:'kanban-task-date',
                            d: { key: 'date_rus' },
                            title: 'Дата начала:\t' + data.date_rus
                        }, 'с : '+data.date_rus),
                        crEl('div', {
                            c: 'kanban-task-date',
                            d: { key: 'deadline' },
                            title: 'Срок задачи:\t' + data.deadline_rus,
                            onclick: function() {
                                app.modules.use('app.tasks.deadline').then(function() {
                                    app.tasks.deadlineEdit(data, function() {
                                        app.msg('Срок задачи изменен')
                                    })
                                })
                            }
                        }, 'до : '+data.deadline_rus)
                    ),

                )
                if (data.archive == 1) {
                    kbItem.classList.add('kanban-task-archive')
                    return kbItem;
                }

                if (data.is_actual) {
                    kbItem.classList.add('kanban-task-actual')
                }

                if (data.incident == 1) {
                    kbItem.classList.add('kanban-task-incident')
                }


                let gn = null;
                switch (params.group) {
                    case 'state':
                        gn = data.state_name;
                        break;
                    case 'deadline':
                        gn = deadlineNames(data.daytype);
                        break;
                    case 'priority':
                        gn = priorityNames(data.priority);
                        break;
                    case 'assignee':
                        gn = data.assignee_name;
                        break;
                    case 'contact':
                        gn = data.contact_name;
                        break;
                    case 'project':
                        gn = data.project_name;
                        break;
                }

                if (gn) {
                    if (!parent.querySelector(".kanban-group-header[data-group-name='" + gn + "']")) {
                        parent.append(crEl('div', { c: 'kanban-group-header', d: { groupName: gn } }, gn))
                            //kbItem.classList.add('kb-group-first-child')
                    }
                }







                if (data.markcomplete == 1) {
                    kbItem.classList.add('task-complete');
                    kbItem.setAttribute('draggable', 'true');
                    let archiveCol = document.getElementById("kb_col_t_0_rs_1")
                    kbItem.addEventListener('dragstart', function(e) {
                        this.style.visibility = 'hidden'
                        archiveCol.classList.remove('kanban-disabled')
                        archiveCol.classList.add('kanban-enabled')
                        archiveCol.ondragover = function(event) { event.preventDefault(); }
                        archiveCol.ondrop = function(e) {
                            e.dataTransfer.dropEffect = 'move'
                            e.preventDefault();
                            if (this.classList.contains('kanban-disabled')) { return false; }


                            app.modules.use('app.tasks.several').then(() => {
                                app.tasks.several.archivate([+data.id], 1, () => {
                                    kbItem.style.position = 'static';
                                    kbItem.classList.add('kanban-task-archive');

                                    archiveCol.classList.remove('kanban-enabled')
                                    archiveCol.classList.remove('kanban-hover')
                                })
                            })




                            archiveCol.appendChild(kbItem.parentNode.removeChild(kbItem))
                            return false;
                        }


                        archiveCol.ondragenter = function(e) {
                            event.preventDefault();
                            event.stopPropagation();
                            if (this.classList.contains('kanban-columd-enabled')) { this.classList.add('kanban-columd-hover'); }
                            return false;
                        }
                        archiveCol.ondragleave = function() {
                            event.preventDefault();
                            event.stopPropagation();
                            this.classList.remove('kanban-columd-hover');
                            return false;
                        }


                    }, false);

                    kbItem.addEventListener('dragend', function(e) {
                        this.style.visibility = 'visible'
                        archiveCol.ondrop = null
                        archiveCol.classList.remove('kanban-disabled', 'kanban-enabled');
                    }, false);

                } else {
                    kbItem.addEventListener('dragstart', function(e) {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.dropEffect = 'move';
                        var there = this,
                            there_event = e;
                        kbItem.style.visibility = 'hidden'

                        kbItem.classList.remove('kb-group-first-child')

                        var curCols = document.querySelectorAll(".kanban-col-body[id^='kb_col_t_" + data.type + "_rs_']");
                        [].forEach.call(curCols, function(c) { c.classList.add('kanban-disabled') })

                        app.fetch(app.root + 'ajax/states.next.load.php', { id: data.id, cur: data.state_id, rout: data.route })
                            .then(function(d) {
                                if (!d || !d.states || !d.states.length) { return; }
                                d.states.forEach(state => {
                                    let el = document.getElementById(`kb_col_t_${data.type}_rs_${state.id}`);
                                    el.classList.remove('kanban-disabled');
                                    el.classList.add('kanban-enabled');
                                    el.ondragover = function(event) { event.preventDefault(); return false; }
                                    el.ondrop = function(e) {
                                        e.preventDefault();

                                        console.log('drop')

                                        if (!this.classList.contains('kanban-columd-disabled')) {
                                            if (data.state_id != state.id) {
                                                app.tasks.changeState(+data.id, +state.id, e.shiftKey ? 0 : +data.auto_comments_task, function(d) {
                                                    //if(params.group){
                                                    //el.empty().animate('fadeOut')
                                                    app.fetch(app.root + 'ajax/tasks_headers_new.php',
                                                            Object.assign({}, params, { type: data.type, routestate: state.id })).then((ctsks) => {
                                                            el.empty();
                                                            ctsks.forEach(x => { el.append(new KBTask(x, el)); })
                                                            el.animate('fadeIn')
                                                                //app.msg('Столбец перезагружен')
                                                            app.timer.init();
                                                            el.querySelector(".kanban-task[data-id='" + data.id + "']").animate('tada');

                                                        })
                                                        //}
                                                })
                                            }
                                            if (
                                                kbItem.previousSibling &&
                                                kbItem.previousSibling.classList.contains('kanban-group-header') && (!kbItem.nextSibling || kbItem.nextSibling.classList.contains('kanban-group-header'))
                                            ) {
                                                kbItem.previousSibling.rem();
                                            }
                                            var ta = kbItem.parentNode.removeChild(kbItem)
                                            if (!params.group) { el.append(ta); }
                                            ta.animate('bounceIn');


                                        }
                                        var curCols = document.querySelectorAll(".kanban-col-body[id^='kb_col_t_" + data.type + "_rs_']");
                                        [].forEach.call(curCols, function(c) {
                                            c.classList.remove('kanban-disabled');
                                            c.classList.remove('kanban-enabled');
                                            c.classList.remove('kanban-hover');
                                        })

                                        return false;
                                    }


                                    el.ondragenter = function(e) {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        if (event.target.classList.contains('task')) {
                                            event.target.classList.add('m-t')
                                        }
                                        if (this.classList.contains('kanban-enabled')) { this.classList.add('kanban-hover'); }
                                        return false;
                                    }
                                    el.ondragleave = function() {
                                        event.preventDefault();
                                        event.stopPropagation();

                                        if (event.target.classList.contains('task')) {
                                            event.target.classList.remove('m-t')
                                        }

                                        this.classList.remove('kanban-hover');
                                        return false;
                                    }

                                })
                            })

                    }, false);


                    kbItem.addEventListener('dragend', function(e) {
                        this.style.visibility = 'visible';
                        var curCols = document.querySelectorAll(".kanban-col-body[id^='kb_col_t_" + data.type + "_rs_']");
                        [].forEach.call(curCols, function(c) {
                            c.classList.remove('kanban-disabled');
                            c.classList.remove('kanban-enabled');
                            c.classList.remove('kanban-hover');
                            c.ondrop = null;
                        })
                        kbItem.ondragenter = null;
                        kbItem.ondragleave = null;


                    }, false)
                }


                return kbItem;
            }






            function addToCol(col, task) {
                col.append(task)
            }







            let tabs = new Tabs({ s: 'display:none;', c: 'kanban' }, { c: 'text-right navs-1' });

            app.fetch(app.root + 'ajax/type_projects_with_states_load.php').then(g => {
                g.forEach((item) => {
                    tabs.addTab('kbGroup' + item.type.id, crEl('span', item.type.name, crEl('sup', { c: 'm-l-xs', id: 'kbTabsHC_' + item.type.id })), crEl({ c: 'kanban-cols' },
                        item.states.map(s => {
                            return crEl({ c: 'kanban-col' },
                                crEl({
                                        c: 'kanban-col-header',
                                        s: 'border-bottom-color:#' + s.color + ';',
                                        onclick: function() {
                                            taskContainer.querySelector('.kanban-container').classList.toggle('kb-tabs-headers-collapse')
                                        }
                                    },
                                    s.name
                                ),
                                crEl({ c: 'kanban-col-body', d: { state: s.id, type: item.type.id, name: 'Переместите сюда задачу для изменения состояния на "' + s.name + '"', sname: s.name }, id: `kb_col_t_${item.type.id}_rs_${s.id}` })
                            )
                        })
                    ))

                    let curTab = tabs.nav.querySelector("[data-id='" + 'kbGroup' + item.type.id + "']");
                    curTab.dataset.route = item.type.id_route;
                    curTab.dataset.idType = item.type.id;

                })

				const archiveColumn = crEl('div', { c: 'kanban-col kanban-archive hide' },
                        crEl({c: 'kanban-col-header', s: 'border-bottom-color:#333333;' },
                            crEl('span', "Архив")
                        ),
                        crEl({ c: 'kanban-col-body', d: { name: 'Перетащите сюда задачу чтобы заархивировать её' }, id: `kb_col_t_0_rs_1` }));

                tabs.nav.append(crEl('a', {
                    title: 'Архив',
                    s: 'float: right;',
                    onclick: () => {
                        archiveColumn.classList.toggle('hide');
                    }
                }, new Icon('archive')));

                tabs.nav.append(crEl('div', { id: 'kb-task-group-toggler-container' },
                    crEl('span', { c: 'text-muted', s: 'opacity:0.5' }, 'Группировать:\u00a0'),
                    crEl('span', { c: 'dropdown' },
                        crEl('a', { href: 'javascript:void(0)', c: 'dropdown-toggle', id: 'task_group_toggler', d: { toggle: 'dropdown' } }),
                        crEl('ul', { c: 'dropdown-menu pull-right', id: 'task_group_toggler_menu' })

                    )
                ))

                taskContainer.empty().append(crEl({ c: 'kanban kanban-container' },
                    crEl('div', { c: 'kanban-col kanban-inbox' },
                        crEl({ c: 'kanban-col-header', s: 'border-bottom-color:#FF9800;' },
                            crEl('span', "Входящие")
                        ),
                        crEl({ c: 'kanban-col-body', id: `kb_col_t_0_rs_0` })
                    ),
                    tabs.dom,
					archiveColumn
                ))
                tabs.onActivate(function(id) {
                    var kbOpt = JSON.parse(ls.get('kanban_opt') || '{}')
                    kbOpt.activeTab = id
                    ls.set('kanban_opt', JSON.stringify(kbOpt))
                })

                tabs.dom.style.display = 'block';

                //tabs.dom.animate('fadeIn')

                let typesCount = {},
                    maxType = null,
                    maxTypeC = null;
                d.forEach((t) => {
                    if (!typesCount[t.type]) { typesCount[t.type] = 0; }
                    typesCount[t.type]++;
                    if (typesCount[t.type] > maxTypeC) {
                        maxTypeC = typesCount[t.type];
                        maxType = t.type
                    }
                    let el = document.getElementById(`kb_col_t_${t.type}_rs_${t.state_id}`);
                    if (el) el.append(new KBTask(t, el))
                })

                for (let k in typesCount) {
                    if (document.getElementById('kbTabsHC_' + k)) {
                        document.getElementById('kbTabsHC_' + k).innerText = typesCount[k].toString()
                    }
                }

                //DEBUG
                //document.querySelector('.kanban .nav-tabs').append(crEl('div',{ direction:'left', c:'alert text-danger alert-sm',s:' background:#FFEBEE; border: 1px solid red; padding:4px 8px; width:280px;position:absolute; left:-6px; top:-16px'},crEl('strong','Интерфейс находится в разработке \u00a0', new Icon('bug'))))


                var kbOpt = JSON.parse(ls.get('kanban_opt') || '{}')
                if (kbOpt && kbOpt.activeTab) {
                    tabs.setActive(kbOpt.activeTab)
                } else {

                    if (maxType) { tabs.setActive('kbGroup' + maxType) } else { tabs.setActive(); }
                }
                if (maxType) { tabs.setActive('kbGroup' + maxType) } else { tabs.setActive(); }

                tabs = null;




                // load_archived
                const archpar = Object.assign({}, params, { archive: 1, date_archivation: Math.round(new Date().getTime() / 1000) })
                app.fetch(app.root + 'ajax/tasks_headers_new.php', archpar).then(res => {
                    let el = document.getElementById('kb_col_t_0_rs_1');
                    el.empty().append(res.map(x => new KBTask(x, el)))
                })

                app.include(['assets/js/app.constructor.inboxSync.js'], function() {


                    //Обновить почту
                    app.modules.use('app.profile.integrations.service')
                        .then(function() {
                            setTimeout(() => {
                                if (app.profile && app.profile.integrations) {
                                    app.profile.integrations.service.selectService(function(id_service) {
                                        app.profile.integrations.service.mail.update(id_service, function(res) {
                                            if (res && res.post_last_update_rus) {
                                                let el = document.getElementById('inboxSyncContainer');
                                                if (el) {
                                                    el.title = 'Последняя проверка почтового ящика на сервере \n' + res.post_last_update_rus;
                                                    el.animate('flipInX');
                                                    el.classList.remove('text-light')
                                                }
                                            }

                                        })
                                    })
                                }
                            }, 500)
                        })






                    function KBInbox(data) {
                        let inbItem = crEl('div', { c: 'task inbox kanban-task kanban-inbox', d: { id: data.id } },
                            crEl({ c: 'kanban-inbox-date', title: data.tf }, data.ts),
                            crEl('a', {
                                c: 'kanban-inbox-subject',
                                href: nav(),
                                onclick: function(event) {
                                    if (event.ctrlKey) {
                                        app.navigate('inbox/' + data.id)
                                    } else {
                                        app.modules.use('app.inbox.quickView').then(() => {
                                            app.inbox.quickView(data)
                                        })
                                    }
                                }
                            }, data.subject),
                            crEl('small', { c: 'kanban-inbox-footer' },
                                crEl('a', { href: nav('contacts/' + data.cid) }, compressFio(data.cname))

                            )
                        );
                        inbItem.addEventListener('dragstart', function(e) {
                            var there = this,
                                there_event = e;
                            this.style.visibility = 'hidden';
                            var td = app.el.pageContent.querySelector('.kanban.tabs-container .active>a').dataset;

                            if (!e.ctrlKey) {

                                var curCols = document.querySelectorAll(".kanban-col-body[id^='kb_col_t_" + td.idType + "_rs_']");
                                [].forEach.call(curCols, function(c) { c.classList.add('kanban-disabled') })

                                app.fetch(app.root + 'ajax/states.next.load.php', { cur: 0, rout: td.route })
                                    .then(function(d) {
                                        if (!d || !d.states || !d.states.length) { return; }
                                        d.states.forEach(state => {
                                            let el = document.getElementById(`kb_col_t_${td.idType}_rs_${state.id}`);
                                            el.classList.remove('kanban-disabled');
                                            el.classList.add('kanban-enabled');
                                            el.ondragover = function(event) { event.preventDefault(); return false; }
                                            el.ondrop = function(e) {
                                                e.preventDefault();
                                                e.dataTransfer.dropEffect = 'move'

                                                if (!this.classList.contains('kanban-columd-disabled')) {
                                                    app.modules.use('app.inbox').then(() => {
                                                        app.inbox.toTaskSlient(data, function(res) {
                                                            app.fetch(app.root + 'ajax/tasks_headers_new.php',
                                                                Object.assign({}, params, { type: td.idType, routestate: state.id })).then((ctsks) => {
                                                                el.empty()
                                                                ctsks.forEach(x => { el.append(new KBTask(x, el)); })
                                                                el.animate('fadeIn')
                                                                el.querySelector(".kanban-task[data-id='" + res.id + "']").animate('tada')
                                                            })
                                                            var ta = inbItem.parentNode.removeChild(inbItem);
                                                            if (!params.group) { el.append(ta); }
                                                            ta.animate('bounceIn');
                                                        });
                                                    })
                                                }
                                                var curCols = document.querySelectorAll(".kanban-col-body[id^='kb_col_t_" + td.idType + "_rs_']");
                                                [].forEach.call(curCols, function(c) {
                                                    c.classList.remove('kanban-disabled');
                                                    c.classList.remove('kanban-enabled');
                                                    c.classList.remove('kanban-hover');
                                                })

                                                return false;
                                            }


                                            el.ondragenter = function(e) {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                if (event.target.classList.contains('task')) {
                                                    event.target.classList.add('m-t')
                                                }
                                                if (this.classList.contains('kanban-enabled')) { this.classList.add('kanban-hover'); }
                                                return false;
                                            }
                                            el.ondragleave = function() {
                                                event.preventDefault();
                                                event.stopPropagation();

                                                if (event.target.classList.contains('task')) {
                                                    event.target.classList.remove('m-t')
                                                }

                                                this.classList.remove('kanban-hover');
                                                return false;
                                            }

                                        })

                                    })

                                inbItem.addEventListener('dragend', function(e) {
                                    this.style.visibility = 'visible';
                                    var curCols = document.querySelectorAll(".kanban-col-body[id^='kb_col_t_" + td.idType + "_rs_']");
                                    [].forEach.call(curCols, function(c) {
                                        c.classList.remove('kanban-disabled');
                                        c.classList.remove('kanban-enabled');
                                        c.classList.remove('kanban-hover');
                                    })
                                })


                            } else {
                                // К задачам

                                var curTasks = document.querySelectorAll(".tabs-container .kanban-col-body[id^='kb_col_t_" + td.idType + "_rs_'] .kanban-task");

                                [].forEach.call(curTasks, function(kTask) {
                                    kTask.classList.add('kanban-task-ready-joined');
                                    kTask.ondragover = function(event) { event.preventDefault(); return false; }
                                    kTask.ondragenter = function(event) {
                                        event.stopPropagation();
                                        this.classList.add('kanban-task-hover-joined');
                                        return false;
                                    }
                                    kTask.ondragleave = function(event) {
                                        event.stopPropagation();
                                        this.classList.remove('kanban-task-hover-joined');
                                        return false;
                                    }
                                    kTask.ondrop = function(e) {
                                        //e.dataTransfer.dropEffect = 'move'
                                        e.preventDefault();


                                        console.log(e)

                                        var setAddition = function(message_id, task_id) {
                                            return false;
                                            app.fetch(app.root + "ajax/task_additions_add.php", { uid: message_id, tid: task_id }, 'POST', 'text').then(function(d) {
                                                if (+d == 1) {
                                                    app.msg("Сообщение добавлено как дополнение к задаче #" + task_id, "success");
                                                    $(there).remove();
                                                }
                                            })
                                        }
                                        var setComment = function(message_id, task_id) {
                                            app.fetch(app.root + "ajax/message_to_comment.php", { mid: message_id, id_task: task_id }, 'POST', 'text').then(function(data) {
                                                let d = parseInt($.trim(data)) || 0;
                                                if (d > 0) {
                                                    app.msg("Сообщение привязано к задаче как комментарий", "success");
                                                    $(there).remove();
                                                } else {
                                                    app.error("Ошибка добавления комментария. " + data)
                                                }

                                            })
                                        }
                                        var setSubTask = function(message_id, task_id) {
                                            app.fetch(app.root + "ajax/message_to_task_load.php", { mid: message_id }).then(
                                                function(d) {
                                                    $(there).remove();
                                                    d.mid = message_id
                                                    d.id_parent = task_id
                                                    app.modules.use('app.tasks.add').then(function() { app.tasks.add(d); })
                                                })
                                        }

                                        var message_id = data.id;
                                        var task_id = this.dataset.id;



                                        if (e.shiftKey) {
                                            setAddition(message_id, task_id);
                                        } else if (e.altKey) {
                                            setComment(message_id, task_id);
                                        } else {

                                            app.modal({
                                                id: 'kanbanJoinMessagesDialog',
                                                width: 300,
                                                title: 'Прикрепить как',
                                                body: crEl('div',
                                                    //crEl('button',{c:'btn btn-block btn-info', d:{'dismiss':'modal'}, e:{click: function(){setAddition(message_id, task_id);}}},'Дополнение'),
                                                    crEl('button', { c: 'btn btn-block btn-info', d: { 'dismiss': 'modal' }, e: { click: function() { setComment(message_id, task_id); } } }, 'Комментарий'),
                                                    crEl('button', { c: 'btn btn-block btn-info', d: { 'dismiss': 'modal' }, e: { click: function() { setSubTask(message_id, task_id); } } }, 'Подзадача')
                                                )
                                            })

                                        }




                                        return false;
                                    }
                                })



                                inbItem.addEventListener('dragend', function(e) {
                                    this.style.visibility = 'visible';
                                    var curTasks = document.querySelectorAll(".tabs-container .kanban-col-body[id^='kb_col_t_" + td.idType + "_rs_'] .kanban-task");
                                    [].forEach.call(curTasks, function(kTask) {
                                        kTask.classList.remove('kanban-task-ready-joined', 'kanban-task-hover-joined', 'kanban-columd-hover');
                                        kTask.ondragover = null;
                                        kTask.ondragenter = null;
                                        kTask.ondragleave = null;
                                        kTask.ondrop = null;

                                    })
                                }, false);




                            }



                        }, false);





                        return inbItem;

                    }
                    let inboxBody = document.getElementById('kb_col_t_0_rs_0');
                    if (!inboxBody) { return false; }
                    let inboxHeader = inboxBody.parentNode.querySelector('.kanban-col-header'),
                        pageView = crEl('small', { c: 'm-l-xs m-r-xs', s: 'display:inline-block; width:18px; text-align:center;', title: 'страница' }, '1')
                    let data = { page: 1, lim: Math.floor(inboxBody.clientHeight / 64) - 2, user: 0, filter: 'untasked' };
                    if (app.tasks.filters) {
                        for (let k in app.tasks.filters.list) {
                            if (app.tasks.filters.list[k]) { data[k] = app.tasks.filters.get(k); }
                        }
                    }

                    inboxHeader.empty().append(crEl('div', { s: 'display:flex' },
                        crEl('div', { s: 'flex:1 24px', c: 'show-on-hover' },
                            crEl('a', {
                                href: nav(),
                                onclick: function() {
                                    if (data.page < 2) { return false; }
                                    data.page = data.page - 1
                                    inboxLoad(data)
                                    pageView.innerText = data.page;
                                }
                            }, '〈'),
                            pageView,
                            crEl('a', {
                                href: nav(),
                                onclick: function() {
                                    if (data.page > data.lastP) { return false; }
                                    data.page = data.page + 1
                                    inboxLoad(data)
                                    pageView.innerText = data.page;
                                }
                            }, '〉')
                        ),
                        crEl('div', { s: 'flex:20', id: 'kbInbHeaderCapt', c: 'text-light' }, 'Входящие ', crEl('small', { id: 'kbInbHeaderCounter' })),
                        crEl('div', { s: 'flex:2 24px', c: 'show-on-hover' },
                            app.constructor.InboxSync()
                        )
                    ))


                    //app.msg()
                    //
                    //
                    function inboxLoad(data, cb) {
                        app.fetch(app.root + 'ajax/inbox_header_limited.php', data)
                            .then(function(d) {
                                if (document.getElementById('kbInbHeaderCapt')) document.getElementById('kbInbHeaderCapt').title = 'Всего ' + d.total
                                inboxBody.empty().append(d.inbox.map(x => { return KBInbox(x) }));
                                data.lastP = Math.floor(d.total / data.lim) - 1
                                if (typeof(cb) == 'function') { cb(inboxBody) }
                                // document.getElementById('kbInbHeaderCounter').innerText = d.total.toString
                            })
                    }

                    inboxLoad(data)


                    document.getElementById('kbInbHeaderCapt').addEventListener('click', function() {

                        inboxLoad(data, function(el) { el.animate('fadeIn') })
                    })

                })




                app.el.pageContent.appendChild(crEl('div', { c: 'tasks-add-float-button', s: 'display:none; z-index: 1000;' },
                    crEl('button', {
                        c: 'btn btn-primary btn-circle btn-lg btn-floating',
                        e: {
                            click: function() {

                                if (params.mode === 'meeting') {
                                    app.modules.use('app.tasks.add').then(function() { app.tasks.add({ mode: 'meeting' }) }, function() {
                                        app.tasks.kanban.reload()
                                    });
                                } else {
                                    app.modules.use('app.tasks.add').then(function() { app.tasks.add(); }, function() {
                                        app.tasks.kanban.reload()
                                    })
                                }

                            }
                        }
                    }, '+')
                ));

                setTimeout(function() {
                    var btn = app.el.pageContent.querySelector('.tasks-add-float-button');
                    if (btn) {
                        btn.style.display = 'block';
                        btn.animate('zoomIn');
                    }


                }, 1000)



                app.timer.init();

                app.tasks.groups.init(params.group);

                if (typeof callback === 'function') { callback.call(taskContainer) }




            }); // end LoadTypes








        } else {

            taskContainer.appendChild(crEl('div', { c: '', s: 'font-weight:100; padding:16px; margin-top:60px; background:rgba(255,255,255,0.33)' }, 'Нет задач в этой категории...'));

        }





    }
}
