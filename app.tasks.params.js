if (!app.tasks) { app.tasks = {}; }
app.tasks.params = function(id_task, callback, container) {
    let tab0Content = crEl('div', { c: 'panel-body' }),
        tab1Content = crEl('div', { c: 'panel-body task-settings-access' }),
        tab2Content = crEl('div', { c: 'panel-body' }),
        tab3Content = crEl('div', { c: 'panel-body' }),
        tab4Content = crEl('div', { c: 'panel-body', s: 'padding:8px;' }),
        tab5Content = crEl('div', { c: 'panel-body' });

    if (!container) {
        app.el.pageHeader.empty().append(
            crEl('div', { c: 'col-sm-4' },
                crEl('h2', 'Редактирование задачи #' + id_task),
            )
        ),
        app.el.pageHeader.append(
            crEl('div', { c: 'col-sm-8' },
                crEl('ol', { c: 'breadcrumb' },
                    crEl('li', crEl('a', { href: nav('/tasks/' + id_task), c: 'active' }, crEl('strong', 'Задача #' + id_task), crEl('small', { id: 'taskEditNameTitle', c: 'm-l' })))
                )
            )
        )
    }



    (container || app.el.pageContent).empty().append(crEl('div', { id: 'taskParamInline' },
        crEl('div', { c: 'tabs-container' },
            crEl('ul', { c: 'nav nav-tabs', id: 'task_settings_tab_activators' },
                crEl('li', { c: 'active' }, crEl('a', { d: { toggle: 'tab', id: 'base' }, href: '#task_settings_base' }, 'Основные')),
                crEl('li', crEl('a', { d: { toggle: 'tab', id: 'desc' }, href: '#task_settings_desc' }, 'Описание')),
                crEl('li', crEl('a', { d: { toggle: 'tab', id: 'attach' }, href: '#task_settings_attach' }, 'Вложения')),
                crEl('li', crEl('a', { d: { toggle: 'tab', id: 'timesheet' }, href: '#task_settings_timesheet' }, 'Затраты времени')),
                crEl('li', crEl('a', { d: { toggle: 'tab', id: 'access' }, href: '#task_settings_access' }, 'Доступ')),
                crEl('li', crEl('a', { d: { toggle: 'tab', id: 'news' }, href: '#task_settings_news' }, 'Уведомления'))
            ),
            crEl('div', { c: 'tab-content', id: 'task_settings_tab_contents' },
                crEl('div', { id: 'task_settings_base', c: 'tab-pane fade in active' }, tab0Content),
                crEl('div', { id: 'task_settings_access', c: 'tab-pane fade' }, tab1Content),
                crEl('div', { id: 'task_settings_attach', c: 'tab-pane fade' }, tab5Content),
                crEl('div', { id: 'task_settings_news', c: 'tab-pane fade' }, tab2Content),
                crEl('div', { id: 'task_settings_timesheet', c: 'tab-pane fade' }, tab3Content),
                crEl('div', { id: 'task_settings_desc', c: 'tab-pane fade' }, tab4Content)

            )
        )
    ).animate('fadeIn'));


    /*app.modal({
    	id:'task_settings_modal',
    	title:'Параметры задачи',
    	body: crEl('div', {c:'tabs-container'},

    		crEl('ul',{c:'nav nav-tabs', id:'task_settings_tab_activators'},
    			crEl('li',{c:'active'}, crEl('a',{d:{toggle:'tab', id:'base'}, href:'#task_settings_base'},'Основные')),
    			crEl('li', crEl('a',{d:{toggle:'tab', id:'desc'}, href:'#task_settings_desc'},'Описание')),
    			crEl('li', crEl('a',{d:{toggle:'tab', id:'timesheet'}, href:'#task_settings_timesheet'},'Затраты времени')),
    			crEl('li', crEl('a',{d:{toggle:'tab', id:'access'}, href:'#task_settings_access'},'Доступ')),
    			crEl('li', crEl('a',{d:{toggle:'tab', id:'news'}, href:'#task_settings_news'},'Уведомления'))
    		),
    		crEl('div',{c:'tab-content'},
    			crEl('div',{id:'task_settings_base', c:'tab-pane fade in active'}, tab0Content ),
    			crEl('div',{id:'task_settings_access', c:'tab-pane fade'}, tab1Content ),
    			crEl('div',{id:'task_settings_news', c:'tab-pane fade'}, tab2Content ),
    			crEl('div',{id:'task_settings_timesheet', c:'tab-pane fade'}, tab3Content ),
    			crEl('div',{id:'task_settings_desc', c:'tab-pane fade'}, tab4Content )

    		)

    	),
    	buttons:[
    		crEl('button',{c:'btn', e:{click:function(){
    			this.close(true)
    		}}},'Отмена'),
    		crEl('button',{c:'btn btn-primary', e:{click:function(){
    			this.close(true)
    		}}},'Сохранить')
    	],
    	modalClass:'modal-lg'
    })*/


    (function() {


        function updateTaskByKey(id_task, key, paramOrVal) {
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

        function syncWithCalendar(id_task, names) {
            let id_service = +document.getElementById("task_edit_typedoc_selector").dataset.idService;
            if (!(id_service > 0)) { return; }
            app.modules.use('app.google')
                .then(function() {
                    let scopes = ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar']
                    _sync = function(res) {
                        app.google.errorHook(res, scopes, _sync)
                        if (res && res.error) { app.error("Не удалось синхронизировать встрчу с календарем. Попробуйте еще раз. <br>" + res.error); return false; }
                        if (res && res.success) {
                            app.msg("Данные успешно сохранены в календаре <b>" + res.calendar.name + "</b>", "success");
                        }
                    }
                    app.google.login(id_service, scopes)
                        .then(function() {
                            app.fetch(app.root + 'ajax/gmail/calendar_set_updates.php', { id_task: id_task, names: names }, 'POST')
                                .then(_sync)
                        })
                })
        }


        function task_save_param(id, name, value, callback, label) {

            app.fetch(app.root + 'ajax/task_save_a_param.php', { id: id, name: name, value: value }, 'POST', 'text')
                .then(function(d) {
                    var res = parseInt($.trim(d));
                    if (res >= 1) {

                        app.fetch('ajax/gmail/outbox_queue.php?send').then(function() {})


                        if (document.getElementById("task_edit_typedoc_selector").value == -1) {
                            syncWithCalendar(id, [name]);
                        }

                        if (name == 'name') {
                            document.getElementById("taskEditNameTitle").innerText = value;
                            // app.setTitle('Редактирование задачи #' + id + '. ' + value)
                        }

                        if (typeof(callback) == 'function') { callback(); } else if (typeof(callback) == 'string') { msg(callback, 'msgOK'); } else { msg('Сохранено', 'msgOK'); }

                        /*
                        if($.trim($("#tadi_cat").text())=='Встреча'){
                        	syncMeeting(id)
                        }	*/

                    } else {
                        msg(d, 'msgERR');
                    }
                })
        }

        function loadTab(id_tab) {
            $('#task_settings_tab_activators a[href="#task_settings_' + id_tab + '"]').tab('show')
                /*	if(id_tab!='base'){ location.hash = id_tab; } else { location.hash="" }*/
            switch (id_tab) {
                case 'base':
                    tab0Content.innerHTML = ''


                    app.fetch(app.root + 'ajax/task_base_info.php', { id: id_task })
                        .then(function(d) {
							console.log(d)
                            //tab0Content.innerHTML = JSON.stringify(d);

                            if (d.sale && !document.getElementById('task_settings_sale_activator')) {

                                document.getElementById('task_settings_tab_activators').prepend(
                                    crEl('li', {}, crEl('a', {
                                        d: { toggle: 'tab', id: 'sale' },
                                        href: '#task_settings_sale',
                                        id: 'task_settings_sale_activator',
                                        onclick: function(event) {

                                            event.preventDefault();
                                            loadTab(this.dataset.id)

                                            return false;
                                        }
                                    }, 'Продажа'))
                                )

                                document.getElementById('task_settings_tab_contents').prepend(
                                    crEl('div', { id: 'task_settings_sale', c: 'tab-pane' }, crEl({ c: 'panel-body', id: 'task_settings_sale_content' }, 'Продажа'))
                                )

                                loadTab('sale')

                            }


                            if (d && d.access && d.access.f_write == 0) { tab0Content.appendChild(crEl('div', { c: 'alert alert-warning' }, 'У вас нет доступа на редактирование этой задачи')); return false; }

                            document.getElementById("taskEditNameTitle").innerText = d.name;
                            // app.setTitle('Редактирование задачи #' + id_task + '. ' + d.name)

                            var form = new Form({ c: 'form-horizontal' });

                            let tInp = crEl('select', {
                                id: 'task_edit_typedoc_selector',

                                onchange: function() {

                                    document.getElementById("task_edit_meeting_params").style.display = this.value == -1 ? '' : 'none';
                                    document.getElementById("taskParamDateInt").disabled = this.value == -2;
                                    if (this.value == -1) {
                                        task_save_param(id_task, 'meeting', 1);
                                    } else {
                                        task_save_param(id_task, 'meeting', 0);
                                    }


                                    if (this.value == -2) {
                                        task_save_param(id_task, 'incident', 1);
                                    } else {
                                        task_save_param(id_task, 'incident', 0);
                                    }
									if (this.value == -3) {
                                        task_save_param(id_task, 'call', 1);
                                    } else {
                                        task_save_param(id_task, 'call', 0);
                                    }
                                    /*
                                    task_save_param
                                    */


                                },
                                c: 'col-md-2'
                            });
                            form.addInp('Тип', tInp)


                            tInp.appendChild(crEl('option', { value: 0, selected: true }, 'Задача')),
                            tInp.appendChild(crEl('option', { value: -1 }, "Встреча")),
                            tInp.appendChild(crEl('option', { value: -2 }, "Инцидент")),
							tInp.appendChild(crEl('option', { value: -3 }, "Телефонный звонок"))
                            if (d.meeting == 1) { tInp.value = -1; }
                            if (d.incident == 1) { tInp.value = -2; }
							if (d.call == 1) { tInp.value = -3; }


                            form.addInp('Место', crEl('input', {
                                placeholder: 'Место встречи',
                                id: 'task_edit_meeting_point_input',
                                e: {
                                    focus: function() {
                                        if (!this.dataset.autocompleteOn) {
                                            var it = this;
                                            app.modules.use('fnn-autocomplete')
                                                .then(function() {

                                                    let aCom = new fnnAutocomplete(it, {
                                                        source: function(term, cb) {
                                                            app.fetch(app.root + 'ajax/meeting_places.php', { term: term }).then(function(res) { cb(res); })
                                                        },
                                                        key: 'name',
                                                        limit: 5,
                                                        closeBtn: true,
                                                        onSelect: function(res) {
                                                            it.dataset.id = res.id;
                                                            task_save_param(id_task, 'meeting_point', res.name);

                                                        },
                                                        noFound: function(name) {

                                                            return crEl('li', {
                                                                e: {
                                                                    click: function() {
                                                                        task_save_param(id_task, 'meeting_point', name);
                                                                    }
                                                                }
                                                            }, name)
                                                        }
                                                    })
                                                    it.dataset.autocompleteOn = 1;
                                                    it.focus()


                                                })
                                        }
                                    }
                                },
                                value: d.place,
                                change: function() { task_save_param(id_task, 'meeting_point', document.getElementById("task_edit_meeting_point_input").value.trim()); }
                            }), { id: 'task_edit_meeting_params', s: d.meeting == 1 ? '' : 'display:none' })

                            let dateInp = new Inp({ c: 'form-control', s: 'width:80%', id: 'taskParamDateInt', disabled: d.incident == 1 })
                            form.addInp('Срок', crEl({ c: 'form-inline' }, dateInp,



                                new Btn({ c: 'btn-white m-l-sm' }, function(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    let el = document.getElementById('task_edit_aid'),
                                        ps = {};
                                    if (el) {
                                        ps = { id: el.dataset.id, name: el.value }
                                    } else {
                                        ps = { id: d.aid, name: d.aname }
                                    }
                                    app.modules.use('app.assigneeLoading').then(() => {
                                        app.assigneeLoading(ps)
                                    });
                                    return false;
                                }, new Icon('flask')),

                                crEl('small', { c: 'right m-l-lg text-muted' }, ' созд. ' + new Date(d.date_create * 1000).toLocaleString())
                            ), { id: 'task_edit_deadline_task' });

                            if (d.markcomplete == '1') {
                                let dateCompleteInp = crEl('input', {id: 'date_complete', value: new Date(d.date_complete * 1000).toLocaleString()});
                                app.modules.use('daterangepicker').then(() => {
                                    $(dateCompleteInp).daterangepicker({
                                        startDate: new Date(d.date_complete * 1000),
                                        endDate: new Date(d.date_complete * 1000),
                                        locale: {
                                            format: 'dd DD MMM HH:mm',
                                            separator: ' - ',
                                            applyLabel: 'ОК',
                                            cancelLabel: 'Отмена',
                                            weekLabel: 'W',
                                            customRangeLabel: 'Диапазон дат'
                                        },
                                        singleDatePicker: true,
                                        timePicker: true,
                                        timePicker24Hour: true,
                                    }).on('apply.daterangepicker', function(a, b) {
                                        console.log(a); // FIXME: удалить этот console.log
                                        console.log(b.endDate); // FIXME: удалить этот console.log
                                        console.log(moment(b.endDate).toDate() / 1000); // FIXME: удалить этот console.log
                                        app.fetch(app.root + 'ajax/task_date_complete.php', { id_task: id_task, date: Math.round(moment(b.endDate).toDate() / 1000)}, 'POST')
                                            .then(function(d){

                                            });
                                    });
                                });
                                form.addInp('Дата завершения', dateCompleteInp);
                            }

                            app.modules.use('daterangepicker', function() {
                                $(dateInp).daterangepicker({
                                    startDate: new Date(d.date * 1000),
                                    endDate: new Date(d.deadline * 1000),
                                    locale: {
                                        format: 'dd DD MMM HH:mm',
                                        separator: ' - ',
                                        applyLabel: 'ОК',
                                        cancelLabel: 'Отмена',
                                        weekLabel: 'W',
                                        customRangeLabel: 'Диапазон дат'
                                    },
                                    singleDatePicker: false,
                                    timePicker: true,
                                    timePicker24Hour: true,
                                    ranges: {
                                        'Сегодня': [moment(), moment().set({ hour: 17, minute: 0 })],
                                        'До завтра': [moment(), moment().add(1, 'days')],
                                        'На завтра': [moment().add(1, 'days').set({ hour: 8, minute: 0 }), moment().add(1, 'days').set({ hour: 17, minute: 0 })],
                                        'До конца недели': [moment(), moment().endOf('week').subtract(2, 'days').set({ hour: 17, minute: 0 })],
                                        'До конца месяца': [moment(), moment().endOf('month').set({ hour: 17, minute: 0 })]

                                    }
                                }).on('apply.daterangepicker', function(a, b) {
                                    app.fetch(app.root + 'ajax/task_dates.php', { id_task: id_task, id_user: document.getElementById("task_edit_aid").dataset.id, date: Math.round(moment(b.startDate).toDate() / 1000), deadline: Math.round(moment(b.endDate).toDate() / 1000) }, 'POST')
                                        .then(function(d) {
                                            if (d && d.duration) {
                                                syncWithCalendar(id, ['date', 'deadline']);
                                                app.msg('Продолжительность изменена на ' + d.duration + '\u00a0ч.', 'success')
                                                app.fetch('ajax/gmail/outbox_queue.php?send').then(function() {})

                                            }
                                        })
                                }).on('showCalendar.daterangepicker', function(ev, picker) {
                                    console.log('ev', ev)
                                    console.log('picker', picker)
                                })



                            })

                            let pInp = crEl('select', {
                                e: {
                                    change: function() {
                                        task_save_param(id_task, 'priority', this.value);
                                    }
                                },
                                c: 'col-md-2'
                            });
                            form.addInp('Приоритет', pInp)
                            app.fetch(app.root + 'ajax/priorities.php').then(function(pr) {
                                pr.forEach(function(p) {
                                    let opt = crEl('option', { value: p.priority }, p.name);
                                    if (p.priority == d.priority) { opt.selected = true }
                                    pInp.appendChild(opt)
                                })

                            });


                            if (d.uid && d.inbox_doc && d.inbox_doc.incoming_number) {
                                form.addInp('Основание', crEl('div', { c: 'form-control' }, crEl('a', { href: '/inbox/' + d.uid, target: '_blank' },
                                    d.inbox_doc.type_doc.name + '\u00a0№' + d.inbox_doc.incoming_number + ' от\u00a0' + d.inbox_doc.incoming_date
                                )))
                            }


                            form.add(crEl('div', { c: 'hr-line-dashed' }))


                            form.addInp('Наименование', crEl('input', {
                                e: {
                                    change: function() {
                                        let str = this.value.trim();
                                        if (str && str.length) {
                                            task_save_param(id_task, 'name', str, function() {
                                                updateTaskByKey(id_task, 'name', str)
                                            });
                                        } else {
                                            app.error('наименование не должно быть пустым');
                                            this.focus()
                                        }
                                    }
                                },
                                value: d.name
                            }))


                            form.add(crEl('div', { c: 'hr-line-dashed' }))


                            form.addInp('Проект', crEl('input', {
                                d: { id: d.pid },
                                id: 'task_edit_pid',
                                e: {
                                    focus: function() {
                                        //
                                        var it = this;


                                        if (!this.dataset.autocompleteOn) {
                                            app.modules.use('fnn-autocomplete')
                                                .then(function() {

                                                    let aCom = new fnnAutocomplete(it, {
                                                        source: function(term, cb) {
                                                            app.fetch(app.root + 'ajax/projects_all.php', { term: term }).then(function(res) { cb(res); })
                                                        },
                                                        key: 'name',
                                                        limit: 5,
                                                        closeBtn: false,
                                                        onSelect: function(res) {
                                                            it.dataset.id = res.id;
                                                            task_save_param(id_task, 'id_project', res.id, function() {
                                                                updateTaskByKey(id_task, 'project', res.name)
                                                            });
                                                        },
                                                        render: function(data) {
                                                            return crEl('li', { s: 'padding: 8px 8px;' },
                                                                data.name
                                                            )
                                                        },
                                                    })

                                                    aCom.search('%');
                                                    it.select();
                                                    it.focus();
                                                    it.dataset.autocompleteOn = 1;
                                                })
                                        }
                                    }
                                },
                                value: d.pname
                            }));

                            form.addInp('Роль', crEl('input', {
                                autocomplete: 'off',
                                id: 'task_edit_rid',
                                d: { id: d.rid },
                                e: {
                                    focus: function() {

                                        var it = this;

                                        if (!this.dataset.autocompleteOn) {
                                            app.modules.use('fnn-autocomplete')
                                                .then(function() {
                                                    let aCom = new fnnAutocomplete(it, {
                                                        source: function(term, cb) {
                                                            app.fetch(app.root + 'ajax/autocomplete.users.forQickAddTaskNew.php', { term: term, pid: document.getElementById("task_edit_pid").dataset.id, type: 'Roles' }).then(function(res) {
                                                                res.unshift({ id: 0, name: 'Не выбран', photo: app.root + 'assets/img/dummy.png', email: 'none' })
                                                                cb(res);
                                                            })
                                                        },
                                                        key: 'name',
                                                        limit: 5,
                                                        closeBtn: true,
                                                        render: function(data) {

                                                            return crEl('li', { s: 'padding: 8px 8px; line-height:15px;' },
                                                                new app.constructor.Avatar(data.photo, data.name, { width: 32, height: 32, c: 'img-circle avatar pull-left', s: 'margin-right:8px' }), data.name, crEl('br')
                                                            )


                                                        },
                                                        onSelect: function(res) {
                                                            it.dataset.id = res.id;
                                                            document.getElementById('task_edit_aid').value = '';
                                                            task_save_param(id_task, 'id_role', res.id > 0 ? res.id : 'NULL', function() {
                                                                updateTaskByKey(id_task, 'role_name', res.name);
                                                                updateTaskByKey(id_task, 'role_photo', { src: app.root + res.photo, name: res.name });
                                                            });
                                                            task_save_param(id_task, 'id_assignee', 'NULL', function() {
                                                                updateTaskByKey(id_task, 'assignee_name', 'NULL');
                                                                updateTaskByKey(id_task, 'assignee_photo', 'NULL');

                                                            });

                                                        }
                                                    })
                                                    aCom.search('%');
                                                    it.select();
                                                    it.focus();
                                                    it.dataset.autocompleteOn = 1;
                                                })
                                        }
                                    }
                                },
                                value: d.rname

                              })

                            );

                            form.addInp('Ответственный', crEl('input', {
                                autocomplete: 'off',
                                id: 'task_edit_aid',
                                d: { id: d.aid },
                                e: {
                                    focus: function() {
                                        //
                                        var it = this;


                                        if (!this.dataset.autocompleteOn) {
                                            app.modules.use('fnn-autocomplete')
                                                .then(function() {

                                                    let aCom = new fnnAutocomplete(it, {
                                                        source: function(term, cb) {
                                                            app.fetch(app.root + 'ajax/autocomplete.users.forQickAddTaskNew.php', { term: term, pid: document.getElementById("task_edit_pid").dataset.id, type: 'Users' }).then(function(res) {
                                                                res.unshift({ id: 0, name: 'Не выбран', photo: app.root + 'assets/img/dummy.png', email: 'none' })
                                                                cb(res);
                                                            })
                                                        },
                                                        key: 'name',
                                                        limit: 5,
                                                        closeBtn: true,
                                                        render: function(data) {

                                                            return crEl('li', { s: 'padding: 8px 8px; line-height:15px;' },
                                                                new app.constructor.Avatar(data.photo, data.name, { width: 32, height: 32, c: 'img-circle avatar pull-left', s: 'margin-right:8px' }), data.name, crEl('br'), crEl('small', { s: 'opacity:0.5' }, data.email)
                                                            )


                                                        },
                                                        onSelect: function(res) {
                                                            document.getElementById('task_edit_rid').value = '';
                                                            it.dataset.id = res.id;
                                                            task_save_param(id_task, 'id_assignee', res.id > 0 ? res.id : 'NULL', function() {
                                                                updateTaskByKey(id_task, 'assignee_name', res.name);
                                                                updateTaskByKey(id_task, 'assignee_photo', { src: app.root + res.photo, name: res.name });
                                                            });
                                                            task_save_param(id_task, 'id_role', 'NULL', function() {
                                                                updateTaskByKey(id_task, 'role_name', res.name);
                                                                updateTaskByKey(id_task, 'role_photo', { src: app.root + res.photo, name: res.name });
                                                            });

                                                        }
                                                    })

                                                    aCom.search('%');
                                                    it.select();
                                                    it.focus();
                                                    it.dataset.autocompleteOn = 1;
                                                })
                                        }
                                    }
                                },
                                value: d.aname
                            }));


                            let extContactsList = crEl('div', { c: 'form-control-static task-edit-contacts-extlist' });
                            let ExtC = function(res) {
                                return new app.constructor.Chips(compressFio(res.name, true), res.photo, function() {
                                    let th = this.parentNode;
                                    app.fetch(app.root + 'ajax/task.contacts.del.php', { id_task: id_task, id_contact: res.id }, 'POST')
                                        .then(function(r) {
                                            if (r && r.success) {
                                                th.animate('zoomOut', function() {
                                                    th.remove();
                                                })
                                            } else {
                                                app.error(r.error || r);
                                            }
                                        })
                                }, { d: { id: res.id }, title: '\n✎ ' + res.name + (res.phone && res.phone.length ? '\n✆ ' + res.phone : '') + (res.email && res.email.length ? '\n✉ ' + res.email : '') })
                            }
                            form.addInp('Контактное\u00a0лицо', crEl('input', {
                                    d: { id: d.cid },
                                    s: 'width:250px',
                                    e: {
                                        focus: function() {
                                            //
                                            var it = this;


                                            if (!this.dataset.autocompleteOn) {
                                                app.modules.use('fnn-autocomplete')
                                                    .then(function() {

                                                        let aCom = new fnnAutocomplete(it, {
                                                            source: function(term, cb) {
                                                                app.fetch(app.root + 'ajax/autocomplete.contacts.forQickAddTask.php', { term: term }).then(function(res) { cb(res); })
                                                            },
                                                            key: 'name',
                                                            limit: 5,
                                                            closeBtn: false,
                                                            render: function(data) {
                                                                return crEl('li', { s: 'padding: 8px 8px; line-height:15px;' },
                                                                    new app.constructor.Avatar(data.photo, data.name, { width: 32, height: 32, c: 'img-circle avatar pull-left', s: 'margin-right:8px' }), data.name, crEl('br'), crEl('small', { s: 'opacity:0.5' }, data.email)
                                                                )
                                                            },
                                                            onSelect: function(res) {
                                                                it.dataset.id = res.id;
                                                                task_save_param(id_task, 'id_contact', res.id, function() {
                                                                    updateTaskByKey(id_task, 'contact_name', res.name)
                                                                    updateTaskByKey(id_task, 'contact_photo', { src: app.root + res.photo, name: res.name });
                                                                });
                                                            }
                                                        })

                                                        aCom.search('%');
                                                        it.select();
                                                        it.focus();
                                                        it.dataset.autocompleteOn = 1;
                                                    })
                                            }
                                        }
                                    },
                                    value: d.cname
                                }), { c: 'form-inline task-edit-contacts' },
                                extContactsList,
                                crEl('input', {
                                    s: 'border-width:0; border-bottom-width:1px;',
                                    placeholder: 'Добавить еще контакт',
                                    e: {
                                        focus: function() {
                                            var it = this;
                                            if (!it.dataset.autocompleteOn) {
                                                app.modules.use('fnn-autocomplete')
                                                    .then(function() {
                                                        let aCom = new fnnAutocomplete(it, {
                                                            minLength: 1,
                                                            autoOpen: false,
                                                            key: 'name',
                                                            closeBtn: false,
                                                            source: function(term, cb) {
                                                                app.fetch(app.root + 'ajax/autocomplete.contacts.forQickAddTask.php', { term: term }).then(function(res) { cb(res); });
                                                            },
                                                            onSelect: function(res) {
                                                                let ex = extContactsList.querySelector(".chip[data-id='" + res.id + "']");
                                                                if (ex) {
                                                                    app.msg("Уже есть")
                                                                    ex.animate('bounceIn')
                                                                } else {

                                                                    app.fetch(app.root + 'ajax/task.contacts.add.php', { id_task: id_task, id_contact: res.id }, 'POST')
                                                                        .then(function(r) {
                                                                            if (r && r.success) {
                                                                                let ctt = ExtC(res);
                                                                                extContactsList.appendChild(ctt);
                                                                                ctt.animate('fadeInUp')
                                                                                syncWithCalendar(id, ['id_contact']);

                                                                            } else {
                                                                                app.error(r.error || r);
                                                                            }
                                                                        })
                                                                }
                                                                it.value = '';
                                                                it.focus();

                                                            }
                                                        })
                                                        it.dataset.autocompleteOn = 1
                                                        it.focus()
                                                        return;


                                                    })
                                            }
                                        }
                                    }
                                })

                            );


                            if (d && d.contacts_more && d.contacts_more.length) {
                                d.contacts_more.forEach(function(c) {
                                    extContactsList.appendChild(ExtC(c));
                                })
                            }



                            form.add(crEl('div', { c: 'hr-line-dashed' }))


                            let Tag = function(res) {
                                return new app.constructor.Chips(res.name, null, function() {
                                    let th = this.parentNode;
                                    let tag = new Tag(res);
                                    app.fetch(app.root + 'ajax/task.tag.delete.php', { taskid: id_task, tagid: res.id }, 'POST', 'text')
                                        .then(function(ra) {
                                            if (ra && parseInt(ra) === 1) {
                                                th.animate('zoomOut', function() { th.remove() })
                                            } else {
                                                app.error(ra)
                                            }
                                        })


                                }, { d: { id: res.id } })
                            }




                            if (d && d.ext_tags && ((d.ext_tags.errors && d.ext_tags.errors.length) || (d.ext_tags.modules && d.ext_tags.modules.length))) {


                                let tagsModulesList = crEl('div', { c: 'form-control-static task-edit-contacts-extlist' });
                                form.addInp('Категории', tagsModulesList, crEl('input', {
                                    s: 'border-width:0; border-bottom-width:1px;',
                                    placeholder: 'Добавить категорию',
                                    e: {
                                        focus: function() {
                                            var it = this;
                                            if (!it.dataset.autocompleteOn) {
                                                app.modules.use('fnn-autocomplete')
                                                    .then(function() {
                                                        let aCom = new fnnAutocomplete(it, {
                                                            minLength: 1,
                                                            autoOpen: false,
                                                            key: 'name',
                                                            closeBtn: false,
                                                            data: d.ext_tags.modules,
                                                            source: function(term, cb){
                                                            	app.fetch(app.root + 'ajax/autocomplete.tags.php',{term:term, is_modules:1})
                                                            	.then(function(d){cb(d)})
                                                            }
                                                                ,
                                                            onSelect: function(res) {
                                                                let ex = tagsModulesList.querySelector(".chip[data-id='" + res.id + "']");
                                                                if (ex) {
                                                                    app.msg("Уже есть")
                                                                    ex.animate('bounceIn')

                                                                } else {
                                                                    let tag = new Tag(res);
                                                                    app.fetch(app.root + 'ajax/task.tag.add.php', { taskid: id_task, tagid: res.id }, 'POST', 'text')
                                                                        .then(function(ra) {
                                                                            if (ra && parseInt(ra) > 0) {
                                                                                tagsModulesList.appendChild(tag);
                                                                                tag.animate('fadeInUp');
                                                                            } else {
                                                                                app.error(ra)
                                                                            }
                                                                        })
                                                                }
                                                                it.value = '';
                                                                it.focus();
                                                            }
                                                        })
                                                        it.dataset.autocompleteOn = 1
                                                        return;


                                                    })
                                            }

                                        }
                                    }
                                }), { c: 'form-inline task-edit-tags' });


                                let tagsSubdivisionList = crEl('div', { c: 'form-control-static task-edit-contacts-extlist' });
                                form.addInp('Подразделения', tagsSubdivisionList, crEl('input', {
                                    s: 'border-width:0; border-bottom-width:1px;',
                                    placeholder: 'Добавить подразделение',
                                    e: {
                                        focus: function() {
                                            var it = this;
                                            if (!it.dataset.autocompleteOn) {
                                                app.modules.use('fnn-autocomplete')
                                                    .then(function() {
                                                        let aCom = new fnnAutocomplete(it, {
                                                            minLength: 1,
                                                            autoOpen: false,
                                                            key: 'name',
                                                            closeBtn: false,
                                                            data: d.ext_tags.modules,
                                                            source: function(term, cb){
                                                                	app.fetch(app.root + 'ajax/autocomplete.tags.php',{term:term, is_modules:2})
                                                                	.then(function(d){cb(d)})
                                                            }
                                                                ,
                                                            onSelect: function(res) {
                                                                let ex = tagsSubdivisionList.querySelector(".chip[data-id='" + res.id + "']");
                                                                if (ex) {
                                                                    app.msg("Уже есть")
                                                                    ex.animate('bounceIn')

                                                                } else {
                                                                    let tag = new Tag(res);
                                                                    app.fetch(app.root + 'ajax/task.tag.add.php', { taskid: id_task, tagid: res.id }, 'POST', 'text')
                                                                        .then(function(ra) {
                                                                            if (ra && parseInt(ra) > 0) {
                                                                                tagsSubdivisionList.appendChild(tag);
                                                                                tag.animate('fadeInUp');
                                                                            } else {
                                                                                app.error(ra)
                                                                            }
                                                                        })
                                                                }
                                                                it.value = '';
                                                                it.focus();
                                                            }
                                                        })
                                                        it.dataset.autocompleteOn = 1
                                                        return;


                                                    })
                                            }

                                        }
                                    }
                                }), { c: 'form-inline task-edit-tags' });

                                let tagsErrorsList = crEl('div', { c: 'form-control-static task-edit-contacts-extlist' });
                                form.addInp('Классифкаторы ошибок', tagsErrorsList, crEl('input', {
                                    s: 'border-width:0; border-bottom-width:1px;',
                                    placeholder: 'Добавить классифкатор ошибки',
                                    e: {
                                        focus: function() {
                                            var it = this;
                                            if (!it.dataset.autocompleteOn) {
                                                app.modules.use('fnn-autocomplete')
                                                    .then(function() {
                                                        let aCom = new fnnAutocomplete(it, {
                                                            minLength: 1,
                                                            autoOpen: true,
                                                            key: 'name',
                                                            closeBtn: false,
                                                            data: d.ext_tags.errors
                                                                /*source: function(term, cb){
                                                                	app.fetch(app.root + 'ajax/autocomplete.tags.php',{term:term})
                                                                	.then(function(d){cb(d)})
                                                                }*/
                                                                ,
                                                            onSelect: function(res) {
                                                                let ex = tagsErrorsList.querySelector(".chip[data-id='" + res.id + "']");
                                                                if (ex) {
                                                                    app.msg("Уже есть");
                                                                    ex.animate('bounceIn');
                                                                } else {
                                                                    let tag = new Tag(res);
                                                                    app.fetch(app.root + 'ajax/task.tag.add.php', { taskid: id_task, tagid: res.id }, 'POST', 'text')
                                                                        .then(function(ra) {
                                                                            if (ra && parseInt(ra) > 0) {
                                                                                tagsErrorsList.appendChild(tag);
                                                                                tag.animate('fadeInUp');
                                                                            } else {
                                                                                app.error(ra)
                                                                            }
                                                                        })
                                                                }
                                                                it.value = '';
                                                            }
                                                        })
                                                        it.dataset.autocompleteOn = 1
                                                        it.focus()
                                                        return;


                                                    })
                                            }



                                        }
                                    }
                                }), { c: 'form-inline task-edit-tags' });


                                if (d.tags && d.tags.length) {
                                    for (var j = 0, lj = d.tags.length; j < lj; j++) {
                                        if (d.tags[j].is_module == 1) {
                                            tagsModulesList.appendChild(new Tag(d.tags[j]));
                                        }
										if (d.tags[j].is_module == 2) {
                                            tagsSubdivisionList.appendChild(new Tag(d.tags[j]));
                                        }
                                        if (d.tags[j].is_error_classification == 1) {
                                            tagsErrorsList.appendChild(new Tag(d.tags[j]));
                                        }
                                    }


                                }

                            }


                            let tagsList = crEl('div', { c: 'form-control-static task-edit-contacts-extlist' });
                            form.addInp('Теги', tagsList, crEl('input', {
                                    s: 'border-width:0; border-bottom-width:1px;',
                                    id: 'Добавить тег',
                                    placeholder: 'Добавить тег',
                                    e: {
                                        focus: function() {
                                            var it = this;
                                            if (!it.dataset.autocompleteOn) {
                                                app.modules.use('fnn-autocomplete')
                                                    .then(function() {
                                                        let aCom = new fnnAutocomplete(it, {
                                                            minLength: 1,
                                                            autoOpen: false,
                                                            key: 'name',
                                                            closeBtn: false,
                                                            limit: 7,
                                                            source: function(term, cb) {
                                                                app.fetch(app.root + 'ajax/autocomplete.tags.php', { term: term })
                                                                    .then(function(d) { cb(d) })
                                                            },
                                                            onSelect: function(res) {
                                                                let ex = tagsList.querySelector(".chip[data-id='" + res.id + "']");
                                                                if (ex) {
                                                                    app.msg("Уже есть")
                                                                    ex.animate('bounceIn')

                                                                } else {
                                                                    let tag = new Tag(res);
                                                                    app.fetch(app.root + 'ajax/task.tag.add.php', { taskid: id_task, tagid: res.id }, 'POST', 'text')
                                                                        .then(function(ra) {
                                                                            if (ra && parseInt(ra) > 0) {
                                                                                tagsList.appendChild(tag);
                                                                                tag.animate('fadeInUp');
                                                                            } else {
                                                                                app.error(ra)
                                                                            }
                                                                        })
                                                                }
                                                                it.value = '';
                                                                it.focus();

                                                            },
                                                            noFound: function(name) {

                                                                return crEl('li', {
                                                                    e: {
                                                                        click: function() {
                                                                            app.fetch(app.root + 'ajax/dialog.tag.add.php', { name: name }, 'POST')
                                                                                .then(function(d) {
                                                                                    if (d && d.success) {
                                                                                        let tag = Tag(d);
                                                                                        app.fetch(app.root + 'ajax/task.tag.add.php', { taskid: id_task, tagid: d.id }, 'POST', 'text')
                                                                                            .then(function(ra) {
                                                                                                if (ra && parseInt(ra) > 0) {
                                                                                                    tagsList.appendChild(tag);
                                                                                                    tag.animate('fadeInUp');
                                                                                                    aCom._close()
                                                                                                    it.value = '';
                                                                                                    it.focus();
                                                                                                } else {
                                                                                                    app.error(ra)
                                                                                                }
                                                                                            })

                                                                                    } else {
                                                                                        app.error(d.error)
                                                                                    }
                                                                                })
                                                                        }
                                                                    }
                                                                }, 'Добавить "' + name + '"')
                                                            }
                                                        })
                                                        it.dataset.autocompleteOn = 1
                                                        it.focus()
                                                        return;


                                                    })
                                            }



                                        }
                                    }
                                }), { c: 'form-inline task-edit-tags' }


                            );

                            if (d && d.tags && d.tags.length) {
                                d.tags.forEach(function(t) {

                                    if (t.is_error_classification == 0 && t.is_module == 0) { tagsList.appendChild(Tag(t)); }
                                })
                            }






                            form.addInp('Продукт', crEl('input', { e: { change: function() { task_save_param(id_task, 'product', this.value.trim()); } }, placeholder: 'Что будет на выходе', value: d.product || '' }))
                            form.addInp('Результат', crEl('input', { e: { change: function() { task_save_param(id_task, 'result', this.value.trim()); } }, placeholder: 'Что улучшится', value: d.result || '' }))

                            tab0Content.appendChild(form._form)

                            if (d && d.calendar_event) {
                                document.getElementById("task_edit_typedoc_selector").dataset.idService = d.calendar_event.id_service
                            }




                            if (d && d.markcomplete && d.markcomplete == 1) {
                                tab0Content.appendChild(crEl('div', { c: 'alert alert-warning' }, 'Задача завершена. Изменение параметров недоступно'));
                                tab0Content.querySelectorAll('input').forEach(function(inp) {
                                    if (inp.id != 'task_edit_pid' && inp.placeholder != 'Добавить тег') {
                                        inp.disabled = true;
                                        inp.title = "Задача завершена. Изменение параметров недоступно."
                                    }

                                    if (inp.id == 'date_complete' && d.iam == d.id_manager) {
                                        inp.disabled = false;
                                        inp.title = 'Дата завершения задачи';
                                    }
                                })
                                tab0Content.querySelectorAll('select').forEach(function(inp) {
                                    inp.disabled = true;
                                    inp.title = "Задача завершена. Изменение параметров недоступно."
                                })
                            }

                            form.addInp('UID', crEl({ c: 'form-control' }, d.uid != 'NULL' ? d.uid || '-' : '-'))


                        })


                    break; //end base
                case 'desc':
                    function savedesc() {
                        let de = document.getElementById("task_editor_description");
                        task_save_param(id_task, 'description', de.innerHTML, function() {
                            updateTaskByKey(id_task, 'description', de.innerHTML);
                            de.blur()
                            app.msg('Описание успешно сохранено', 'success')
                        })
                    }

                    function EditorBtn(action, title, icon) {
                        return crEl('a', { href: 'javascript:void(0)', c: 'btn', action: action, d: { originalTitle: title } }, new MIcon(icon, 'md-18'))
                    }

                    let toolbar = crEl('div', { c: 'editor-toolbar' },
                            crEl('button', { c: 'btn btn-primary pull-right', e: { click: savedesc } }, 'Сохранить'),

                            new EditorBtn('undo', 'Отменить', 'undo'),
                            new EditorBtn('redo', 'Повторить', 'redo'),
                            crEl('div', { c: 'delimer' }),
                            new EditorBtn('bold', 'Жирный', 'format_bold'),
                            new EditorBtn('italic', 'Курсив', 'format_italic'),
                            new EditorBtn('underline', 'Подчеркнутый', 'format_underlined'),
                            crEl('div', { c: 'delimer' }),
                            new EditorBtn('insertUnorderedList', 'Маркированный список', 'format_list_bulleted'),
                            new EditorBtn('insertOrderedList', 'Нумерованный список', 'format_list_numbered'),
                            crEl('div', { c: 'delimer' }),
                            new EditorBtn('justifyLeft', 'По левому краю', 'format_align_left'),
                            new EditorBtn('justifyCenter', 'По центру', 'format_align_center'),
                            new EditorBtn('justifyRight', 'По правому краю', 'format_align_right'),
                            new EditorBtn('justifyFull', 'По ширине', 'format_align_justify'),
                            crEl('div', { c: 'delimer' }),
                            new EditorBtn('createLink', 'Вставить ссылку', 'insert_link'),
                            new EditorBtn('insertImage', 'Вставить изображение', 'insert_photo'),
                            crEl('div', { c: 'delimer' }),
                            new EditorBtn('removeFormat', 'Очистить форматирование', 'format_clear')


                        ),
                        desc = crEl('div', { id: 'task_editor_description', placeholder: 'Введите описание задачи', s: 'min-height:400px; margin:8px; padding:8px;' });


                    desc.addEventListener("keydown", function(e) {
                        if (e.keyCode === 83 && e.ctrlKey || e.metaKey) {
                            e.preventDefault(); //Good browsers
                            if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) { //hack for ie

                                return;
                            }
                            savedesc();

                        }
                    });


                    tab4Content.innerHTML = '';
                    tab4Content.appendChild(crEl('div',
                        desc, toolbar
                    ));


                    $(toolbar).find('.btn').tooltip({

                        placement: 'bottom'
                    })



                    app.modules.use('eWysiwyg')
                        .then(function() {

                            var editor = new EWysiwyg(desc, toolbar);
                            editor.init({
                                createLink: function(cb, txt) {
                                    app.modal({
                                        id: 'editorLinkAddModal',
                                        mode: 'form',
                                        modalClass: 'modal-sm',
                                        title: 'Выбор ссылки',
                                        animation: "zoomInUp",
                                        body: crEl('div',
                                            new Input({ id: 'linkText', required: true, value: txt }, "Текст ссылки"),
                                            new Input({ id: 'linkUrl', type: 'url', value: 'http://', required: true }, "Ссылка")
                                        ),
                                        buttons: [crEl('input', { type: 'submit', c: 'btn btn-primary' }, 'Вставить')]
                                    }).then(function(id) {
                                        document.getElementById('linkUrl').onfocus = function() {
                                            this.selectionStart = this.value.length;
                                        }
                                        if (txt && txt.length) {
                                            setTimeout(function() { document.getElementById('linkUrl').focus(); }, 1);
                                        } else {
                                            setTimeout(function() { document.getElementById('linkText').focus(); }, 1);
                                        }


                                        document.getElementById(id).onsubmit = function(event) {
                                            event.preventDefault();
                                            console.log(document.getElementById("linkUrl").value.trim(), document.getElementById("linkText").value.trim())
                                                //	cb(crEl('a',{href: document.getElementById("linkUrl").value.trim()}, document.getElementById("linkText").value.trim()))
                                            cb(document.getElementById("linkUrl").value.trim())
                                            $("#editorLinkAddModal").modal('hide');
                                            return false;
                                        }
                                    })
                                    var a, b, link;
                                },
                                insertImage: function(cb) {
                                    app.modal({
                                        id: 'editorImgAddModal',
                                        mode: 'form',
                                        modalClass: 'modal-sm',
                                        title: 'Изображение',
                                        animation: "zoomInUp",
                                        body: crEl('div',

                                            new Input({ id: 'linkUrl', type: 'url', value: 'http://', required: true }, "URL картинки")
                                        ),
                                        buttons: [crEl('input', { type: 'submit', c: 'btn btn-primary' }, 'Вставить')]
                                    }).then(function(id) {
                                        document.getElementById("linkUrl").focus()
                                        document.getElementById(id).onsubmit = function(event) {
                                            event.preventDefault();

                                            cb(crEl('img', { src: document.getElementById("linkUrl").value.trim() }))
                                            $("#editorImgAddModal").modal('hide');
                                            return false;
                                        }
                                    })

                                }
                            })
                            setTimeout(function() { desc.focus() }, 500)

                            app.fetch(app.root + 'ajax/task_base_info.php', { id: id_task }).then(function(d) {
                                desc.innerHTML = d.description;
                                desc.focus()
                                if (d && d.markcomplete && d.markcomplete == 1) {

                                    desc.disabled = true;
                                    desc.title = "Задача завершена. Изменение параметров недоступно."
                                    desc.removeAttribute('contenteditable')
                                    toolbar.style.display = 'none'
                                }
                            })

                        })


                    break; //end desc
                case 'timesheet':



                    function loadTs() {
                        tab3Content.empty().append(new app.constructor.InlinePreloader('Загрузка...'));
                        app.fetch(app.root + 'ajax/durationExt.php', { id: id_task })
                            .then(function(d) {
                                if (d.error) { tab3Content.innerHTML = "Ошибка<pre>" + d.error; return false; }
                                if (d.items && d.items.length === 0) { tab3Content.innerHTML = '<div class="alert alert-info">Нет данных о времени затраченном на эту задачу.</div>'; }

                                tab3Content.empty();
                                if (d.items.length > 0) {
                                    let tbody = crEl('tbody')
                                    let summ = 0;
                                    var Tr = function(data) {
                                        let dsk = crEl('div');
                                        dsk.innerHTML = (data.comment && data.comment.length) ? data.comment : '\u00a0';
                                        return crEl('tr',
                                            crEl('td', data.user),
                                            crEl('td', dsk),
                                            crEl('td', data.start),
                                            crEl('td', data.finish),
                                            crEl('td', (data.durat / 60).toFixed(2).toString() + '\u00a0ч.'),
                                            crEl('td', { c: 'text-center', s: 'width:24px' }, crEl('a', {
                                                href: nav(),
                                                title: 'Редактировать запись',
                                                onclick: function() {
                                                    app.modules.use('app.timesheet.edit')
                                                        .then(function() {
                                                            app.timesheet.edit(id_task, data, function() {
                                                                $('#tadiAddTimesheetRowDialog').modal('hide');
                                                                loadTab('timesheet')
                                                            }, function() {
                                                                $("#task_settings_modal").modal('hide');
                                                                $('#tadiAddTimesheetRowDialog').on('hidden.bs.modal', function(e) {
                                                                    $("#task_settings_modal").modal('show');
                                                                })
                                                            })
                                                        })
                                                }
                                            }, new Icon('pencil'))));
                                    }


                                    for (i = 0; i < d.items.length; i++) {
                                        tbody.appendChild(new Tr(d.items[i]));
                                        summ += parseFloat(d.items[i].durat);
                                    }

                                    var table = crEl('table', { c: 'table table-striped table-bordered table-hover' },
                                        crEl('thead',
                                            crEl('tr',
                                                crEl('th', 'Пользователь'),
                                                crEl('th', 'Комментарий'),
                                                crEl('th', 'Начало'),
                                                crEl('th', 'Завершение'),
                                                crEl('th', 'Продолжительность'),
                                                crEl('th', '\u00a0')
                                            )
                                        ),
                                        tbody,
                                        crEl('tfoot',
                                            crEl('tr',
                                                crEl('td', { colspan: 4, style: 'text-align:right' }, 'Итого:'),
                                                crEl('td', { colspan: 2 }, (summ / 60).toFixed(2) + '\u00a0ч.')
                                            )
                                        )

                                    );
                                    tab3Content.appendChild(table);
                                    table.animate('fadeIn')
                                    table = null;

                                }

                                var btn = crEl('button', {
                                    c: 'btn btn-sm btn-primary pull-left',
                                    e: {
                                        click: function() {
                                            app.modules.use('app.timesheet.edit')
                                                .then(function() {
                                                    app.timesheet.edit(id_task, null, function() {
                                                        $('#tadiAddTimesheetRowDialog').modal('hide');
                                                        loadTs()
                                                    }, function() {
                                                        $("#task_settings_modal").modal('hide');
                                                        loadTab('timesheet')
                                                        $('#tadiAddTimesheetRowDialog').on('hidden.bs.modal', function(e) {
                                                            $("#task_settings_modal").modal('show');
                                                        })
                                                        loadTs()
                                                    })
                                                })
                                        }
                                    },
                                    title: 'Добавить запись о времени'
                                }, 'Добавить');
                                tab3Content.appendChild(btn)


                                btn.animate('zoomInDown')


                            })
                    }


                    loadTs()

                    break; //end timesheet
                case 'access':
                    function addAccess() {
                        $("#task_settings_modal").modal('hide');
                        app.modal({
                            id: 'task_settings-acces-user_modal_add',
                            title: 'Добавление доступа',
                            body: crEl('div', { id: 'task_settings-acces-user_modal_add_body' }),
                            modalClass: 'modal-sm'
                        }).then(function() {

                            $('#task_settings-acces-user_modal_add').on('hidden.bs.modal', function(e) {
                                $("#task_settings_modal").modal('show');
                            })




                            let bod = document.getElementById("task_settings-acces-user_modal_add_body");
                            bod.innerHTML = "";


                            var inp = crEl('input', { placeholder: 'Начните вводить имя' })
                            bod.appendChild(inp)


                            app.modules.use('fnn-autocomplete')
                                .then(function() {
                                    let aCom = new fnnAutocomplete(inp, {
                                        render: function(data) {
                                            return crEl('li',
                                                new app.constructor.Avatar(data.photo, data.name, { width: 24, height: 24, c: 'img-circle avatar' }),
                                                '\u00a0 ', crEl('span', data.name)

                                            )
                                        },
                                        minLength: 0,
                                        autoOpen: false,
                                        key: 'name',
                                        closeBtn: false,
                                        source: function(term, cb) {
                                            app.fetch(app.root + 'ajax/autocomplete.users.php', { term: term })
                                                .then(function(d) { cb(d) })
                                        },
                                        onSelect: function(res) {

                                            var d = {
                                                id_task: id_task,
                                                id_user: res.id,
                                                f_read: true,
                                                f_write: false,
                                                name: res.name,
                                                photo: res.photo
                                            }


                                            app.fetch(app.root + 'ajax/task_access_save.php', d, 'POST', 'text')
                                                .then(function(resp) {
                                                    if (resp && parseInt(resp) > 0) {
                                                        loadAccess(id_task)

                                                        //$("#task_settings_modal").modal('show');
                                                        document.getElementById("task_settings-acces-user_modal_add").close(true)
                                                        editAccess(d);
                                                        app.sendQueue();


                                                    } else {
                                                        app.error(resp)
                                                    }
                                                })
                                            console.log(res);
                                        }
                                    })
                                    aCom.search('');
                                    $(inp).focus();

                                })


                        })
                    }

                    function editAccess(data) {
                        $("#task_settings_modal").modal('hide');

                        app.modal({
                            id: 'task_settings-acces-user_modal',
                            //title:'Настройки доступа',
                            body: crEl('div', { id: 'task_settings-acces-user_modal_body' }),
                            buttons: [
                                crEl('button', {
                                    c: 'btn',
                                    e: {
                                        click: function() {
                                            this.close(true);
                                            $("#task_settings_modal").modal('show');
                                        }
                                    }
                                }, 'Отмена'),
                                crEl('button', {
                                    c: 'btn btn-primary',
                                    e: {
                                        click: function() {

                                            var d = {
                                                id_task: id_task,
                                                id_user: data.id_user,
                                                f_read: document.getElementById("task_settings_access_f_read").checked,
                                                f_write: document.getElementById("task_settings_access_f_write").checked
                                            }
                                            let th = this;



                                            app.fetch(app.root + (!d.f_read && !d.f_write ? 'ajax/task_access_del.php' : 'ajax/task_access_save.php'), d, 'POST', 'text')
                                                .then(function(resp) {
                                                    if (resp && parseInt(resp) == 1) {
                                                        app.msg("Данные успешно сохранены", "success");
                                                        loadAccess(id_task)
                                                        th.close(true);
                                                        $("#task_settings_modal").modal('show');
                                                        app.fetch('ajax/gmail/outbox_queue.php?send').then(function() {})

                                                    } else {
                                                        app.error(resp)
                                                    }
                                                })


                                        }
                                    }
                                }, 'Сохранить')
                            ],
                            modalClass: 'modal-sm'
                        }).then(function() {

                            $('#task_settings-acces-user_modal').on('hidden.bs.modal', function(e) {
                                $("#task_settings_modal").modal('show');
                            })

                            let bod = document.getElementById("task_settings-acces-user_modal_body");
                            bod.innerHTML = "";
                            if (data) {
                                bod.appendChild(crEl('div', { s: 'text-align:center' },
                                    crEl('div', {},
                                        new app.constructor.Avatar(data.photo, data.name, { width: 130, height: 130, c: 'img-circle avatar' })
                                    ),
                                    crEl('h2', data.name)

                                ))

                                function Tr(param, name, currentChecked) {
                                    return crEl('tr',
                                        crEl('td', { s: 'padding:16px 0px 8px 16px;' }, crEl('label', { for: 'task_settings_access_' + param }, name)),
                                        crEl('td', { s: 'padding:16px 8px 16px 0;width:60px' }, new app.constructor.Switch({ id: 'task_settings_access_' + param, checked: currentChecked }))
                                    )
                                }

                                bod.appendChild(crEl('p', { s: 'margin:0' },

                                    crEl('table', { c: 'table table-stripted table-hover table-collapsed' },
                                        crEl('tbody',
                                            new Tr('f_read', 'Чтение', data.f_read == 1),
                                            new Tr('f_write', 'Запись', data.f_write == 1)

                                        )
                                    )

                                ))

                                document.getElementById("task_settings_access_f_write").onchange = function() {
                                    document.getElementById("task_settings_access_f_read").checked = true;
                                }

                            }

                        })

                    }

                    function UserAccess(data, is_editable) {

                        let ch1 = '+',
                            ch0 = '-'

                        return crEl('tr',
                            crEl('td', new app.constructor.Avatar(data.photo, data.name, { width: 24, height: 24, c: 'img-circle avatar' }), '\u00a0' + data.name),
                            crEl('td', { s: 'text-align:center' }, (data.f_write == 1 ? ch1 : ch0)),
                            crEl('td', { s: 'text-align:center' }, (data.f_read == 1 ? ch1 : ch0)),
                            crEl('td', { s: 'text-align:center' }, (data.f_access == 1 ? ch1 : ch0)),
                            crEl('td', data.my ? crEl('a', {
                                href: 'javascript:void(0)',
                                c: 'pull-right',
                                s: 'font-size:12px; color:inherit',
                                e: {
                                    click: function() {
                                        editAccess(data);
                                    }
                                }
                            }, new MIcon('create')) : null, crEl('em', data.note))
                        )

                    }

                    function loadAccess(id_task) {
                        tab1Content.innerHTML = '';
                        app.fetch(app.root + 'ajax/task_access_load.php', { id: id_task })
                            .then(function(d) {
                                let tbody = crEl('tbody')
                                tab1Content.appendChild(crEl('button', { c: 'btn btn-primary btn-circle btn-floating', e: { click: addAccess } }, '+').animate('fadeIn'))
                                d.users.forEach(function(k) {
                                    tbody.appendChild(new UserAccess(k, d.editable));
                                })
                                tab1Content.appendChild(crEl('table', { c: 'table table-hover' },
                                    crEl('thead',
                                        crEl('tr',
                                            crEl('th', 'Пользователь'),
                                            crEl('th', { width: 80 }, 'Запись'),
                                            crEl('th', { width: 80 }, 'Чтение'),
                                            crEl('th', { width: 80 }, 'Доступ'),
                                            crEl('th', 'Пользователь')
                                        )
                                    ),

                                    tbody

                                ).animate('zoomInTop'))

                            })
                    }

                    loadAccess(id_task)
                    break; //end access
                case 'news':
                    app.fetch(app.root + 'ajax/news_subs_load.php', { id: id_task })
                        .then(function(d) {
                            function Tr(data) {
                                return crEl('tr',
                                    crEl('td', { s: 'padding:16px 16px 8px 16px;' }, crEl('label', { s: 'display:block; width:100%', for: 'task_subs_' + data.id }, data.name)),
                                    crEl('td', { s: 'padding:16px 16px 8px 0px; width:60px' }, new app.constructor.Switch({
                                        id: 'task_subs_' + data.id,
                                        checked: parseInt(data.subs) > 0,
                                        d: { type: data.id },
                                        e: {
                                            change: function() {
                                                var d = {
                                                    id_task: id_task,
                                                    id_type: data.id,
                                                    val: this.checked ? 1 : 0
                                                }

                                                app.fetch(app.root + 'ajax/news_subs_change.php', d, 'POST', 'text')
                                                    .then(function(res) {
                                                        if (!parseInt(res) > 0) { app.error(res) }
                                                    })

                                            }
                                        }
                                    }))

                                )
                            }
                            let tbody = crEl('tbody')
                            d.forEach(function(k) {
                                tbody.appendChild(new Tr(k));
                            })
                            tab2Content.appendChild(crEl('table', { c: 'table table-stripted table-hover' }, tbody))
                        })
                    break; //end news
                case 'attach':
                    app.fetch(app.root + 'ajax/task_load_related_files_info.php', { id: id_task })
                        .then((d) => {
                            let groups = [],
                                gNames = ['Из задачи', 'Из задачи', 'Из дополнений', 'Из комментариев', 'Из комментариев']


                            function tadiUploadAndBindFiles(files, id_task, callback) {
                                if (!id_task) { throw new Error('Bind attach to task without task id') }
                                var http = new XMLHttpRequest();
                                if (http.upload && http.upload.addEventListener) {
                                    http.onreadystatechange = function() {
                                        if (this.readyState == 4) {
                                            if (this.status == 200) {
                                                let result = JSON.parse(this.response);
                                                document.getElementById('attachmentsListGroup0').append(result.map(a => {
                                                    return new app.constructor.Attachment(a)
                                                }))
                                                if (typeof(callback) === 'function') { callback(result) }

                                            }
                                        }
                                    };
                                }

                                var form = new FormData(); // Создаем объект формы.
                                form.append('path', ''); // Определяем корневой путь.
                                for (var i = 0; i < files.length; i++) {
                                    form.append('file[]', files[i]); // Прикрепляем к форме все загружаемые файлы.
                                }

                                form.append('id_task', id_task);

                                http.open('POST', '../../../files/upload_several.php'); // Открываем коннект до сервера.
                                http.send(form);
                            }

                            d.forEach(k => {
                                // if (!(+k.a_type in groups)) {
                                //     groups.push(+k.a_type)
                                // }
                                if (groups.indexOf(+k.a_type) == -1) {
                                    groups.push(+k.a_type);
                                }
                            })

                            tab5Content.empty().append([
                                groups.length ? crEl({ c: 'row' },
                                    groups.map(x => {
                                        return crEl({ c: 'col-sm-' + Math.floor(12 / groups.length) },
                                            crEl('h3', { c: 'text-light' }, gNames[x]),
                                            crEl('div', { id: 'attachmentsListGroup' + x })
                                        )
                                    })
                                ) : crEl({ c: 'row' },
                                    crEl({ c: 'col-sm-12' },
                                        crEl('h3', { c: 'text-light' }, gNames[0]),
                                        crEl('div', { id: 'attachmentsListGroup0' })
                                    )

                                ),
                                crEl('hr'),
                                crEl({ c: 'row' },
                                    crEl({ c: 'col-sm-12 form-inline' },
                                        crEl('span', { c: 'text-muted pull-left m-r ' }, 'Добавить файл: '), new Inp({
                                            t: 'file',
                                            onchange: function() {

                                                tadiUploadAndBindFiles(this.files, id_task, function(res) {

                                                    app.msg(res.length > 0 ? (res.length === 1 ? 'Файл успешно добавлен' : 'Файлы успешно добавлены') : 'ошибка', 'success')
                                                })

                                            }
                                        })
                                    )
                                )
                            ])









                            d.forEach(k => {
                                document.getElementById('attachmentsListGroup' + k.a_type).append(
                                    new app.constructor.Attachment(k)
                                )
                            })

                        })
                    break; //end news
                case 'sale':

                    let el = document.getElementById('task_settings_sale_content');
                    el.empty()
                    app.fetch(app.root + 'ajax/task_base_info.php', { id: id_task })
                        .then(function(d) {


                            let form = new Form({ c: 'form-horizontal' });
                            form.addInp('Фирма', new Inp({
                                v: d.id_firm ? d.firm.name : null,
                                d: { id: d.id_firm },
                                id: 'saleEditFirm',
                                onfocus: function() {
                                    let it = this;
                                    if (!this.dataset.autocompleteOn) {
                                        app.modules.use('fnn-autocomplete')
                                            .then(function() {

                                                let aCom = new fnnAutocomplete(it, {
                                                    source: function(term, cb) {
                                                        app.fetch('ajax/contragents_all.php', { mode: 'firm', q: term }).then(cb)
                                                    },
                                                    key: 'name',
                                                    containerAttr: { s: 'display:block' },
                                                    limit: 5,
                                                    closeBtn: true,
                                                    render: function(data) {

                                                        return crEl('li', { s: 'padding: 8px 8px; line-height:15px;' },
                                                            new app.constructor.Avatar(data.photo, data.name, { width: 32, height: 32, c: 'img-circle avatar pull-left', s: 'margin-right:12px' }), data.name, crEl('br'), crEl('small', { s: 'opacity:0.5' }, data.fullname)
                                                        )


                                                    },
                                                    onSelect: function(res) {
                                                        it.dataset.id = res.id;
                                                        app.fetch('ajax/task_contragent_set.php', { id_task: d.id, id_contragent: res.id > 0 ? res.id : 'NULL', type: 'task_firm' }, 'POST', 'text').then(res => {
                                                            app.msg('Фирма установлена', 1)
                                                            updateTaskByKey(id_task, 'firm', res.name);
                                                        })


                                                        let saleEditContragent = document.getElementById('saleEditContragent');
                                                        document.getElementById('saleEditContract').disabled = !(saleEditContragent.dataset && saleEditContragent.dataset.id && saleEditContragent.dataset.id > 0);



                                                    }
                                                })

                                                aCom.search('%');
                                                it.select();
                                                it.focus();
                                                it.dataset.autocompleteOn = 1;
                                            })
                                    }
                                }
                            }))
                            form.addInp('Контрагент', new Inp({
                                v: d.contragent && d.contragent.name ? d.contragent.name : null,
                                d: { id: d.id_contragent },
                                id: 'saleEditContragent',
                                onfocus: function() {
                                    let it = this;
                                    if (!this.dataset.autocompleteOn) {
                                        app.modules.use('fnn-autocomplete')
                                            .then(function() {

                                                let aCom = new fnnAutocomplete(it, {
                                                    source: function(term, cb) {
                                                        app.fetch('ajax/contragents_all.php', { mode: 1, q: term }).then(cb)
                                                    },
                                                    key: 'name',
                                                    containerAttr: { s: 'display:block' },
                                                    limit: 5,
                                                    closeBtn: true,
                                                    render: function(data) {

                                                        return crEl('li', { s: 'padding: 8px 8px; line-height:15px;' },
                                                            new app.constructor.Avatar(data.photo, data.name, { width: 32, height: 32, c: 'img-circle avatar pull-left', s: 'margin-right:12px' }), data.name, crEl('br'), crEl('small', { s: 'opacity:0.5' }, data.fullname)
                                                        )


                                                    },
                                                    onSelect: function(res) {
                                                        it.dataset.id = res.id;
                                                        app.fetch('ajax/task_contragent_set.php', { id_task: d.id, id_contragent: res.id > 0 ? res.id : 'NULL', type: 'task_contragent' }, 'POST', 'text').then(res => {
                                                            app.msg('Контрагент установлен', 1)
                                                            updateTaskByKey(id_task, 'contragent', res.name);
                                                        })

                                                        let saleEditFirm = document.getElementById('saleEditFirm');
                                                        document.getElementById('saleEditContract').disabled = !(saleEditFirm.dataset && saleEditFirm.dataset.id && saleEditFirm.dataset.id > 0);


                                                    }
                                                })

                                                aCom.search('%');
                                                it.select();
                                                it.focus();
                                                it.dataset.autocompleteOn = 1;
                                            })
                                    }
                                }
                            }))
                            form.addInp('Договор', crEl('select', {
                                id: 'saleEditContract',
                                // disabled: d.id_firm > 0 && d.id_contragent > 0,
                                onfocus: function() {
                                    let it = this;

                                    if (!this.dataset.autocompleteOn) {
                                        let id_contragent = d.id_contragent || 0,
                                            id_firm = d.id_firm || 0;
                                        let el = null;
                                        el = document.getElementById('saleEditContragent');
                                        if (el && el.dataset && el.dataset.id && +el.dataset.id > 0) { id_contragent = el.dataset.id; } else {
                                            app.msg("Необходимо выбрать контрагента");
                                            setTimeout(() => { el.focus() }, 1000)
                                            return false;
                                        }
                                        el = document.getElementById('saleEditFirm');
                                        if (el && el.dataset && el.dataset.id && +el.dataset.id > 0) { id_firm = el.dataset.id; } else {
                                            app.msg("Необходимо выбрать фирму");
                                            setTimeout(() => { el.focus() }, 1000)
                                            return false;
                                        }




                                        app.fetch('ajax/outbox_load_by_project.php', {
                                            id_project: d.pid || 0,
                                            id_contragent: id_contragent,
                                            id_firm: id_firm
                                        }).then(res => {
                                            it.empty().append(res.map(x => { return crEl('option', { value: x.id, selected: x.id == d.id_outbox }, x.subject) }))
                                            it.dataset.autocompleteOn = 1;
                                            // let onChangeEvent = new Event("change");
                                            // it.dispatchEvent(onChangeEvent);
                                        })



                                    }

                                },
                                onchange: function() {
                                    app.fetch('ajax/task_outbox_set.php', { id_task: d.id, id_outbox: this.value }, 'POST', 'text').then(res => {
                                        app.msg('Сохранено', 1)
                                    })
                                }
                            }, d.id_outbox ? new Option(d.outbox.name, d.outbox.id, true, true) : null))

                            form.addInp('Сумма', new Inp({
                                t: 'number',
                                v: d.total,
                                step: 0.01,
                                onchange: function() {
                                    task_save_param(id_task, 'total', this.value, function() {
                                        updateTaskByKey(id_task, 'total', this.value);
                                    });
                                }
                            }))

                            form.addInp('Валюта', crEl('select', {
                                onfocus: function() {

                                    let it = this;
                                    if (!this.dataset.autocompleteOn) {

                                        app.fetch('ajax/price_currency_all.php?mode=1', {}).then(res => {
                                            it.empty().append(res.map(x => { return crEl('option', { value: x.id, selected: x.id == d.id_currency }, x.name) }))
                                            it.dataset.autocompleteOn = 1;
                                        })



                                    }

                                },
                                onchange: function() {
                                    app.fetch('ajax/task_currency_set.php', { id_task: d.id, id_currency: this.value }, 'POST', 'text').then(res => {
                                        app.msg('Сохранено', 1)
                                    })
                                }
                            }, d.id_currency ? new Option(d.currency.name, d.currency.id, true, true) : null));
                            form.addInp('Связанный проект', new Inp({
                                v: d.rel_project ? d.related_project.name : null,
                                d: { id: d.rel_project },
                                onfocus: function() {
                                    let it = this;
                                    if (!this.dataset.autocompleteOn) {
                                        app.modules.use('fnn-autocomplete')
                                            .then(function() {

                                                let aCom = new fnnAutocomplete(it, {
                                                    source: function(term, cb) {
                                                        app.fetch('ajax/projects_all.php?mode=1', { mode: 1, q: term }).then(cb)
                                                    },
                                                    key: 'name',
                                                    limit: 5,
                                                    containerAttr: { s: 'display:block' },
                                                    closeBtn: true,
                                                    render: function(data) {

                                                        return crEl('li', { s: 'padding: 8px 8px; line-height:15px;' },
                                                            new app.constructor.Avatar(data.photo, data.name, { width: 32, height: 32, c: 'img-circle avatar pull-left', s: 'margin-right:12px' }), data.name, crEl('br'), crEl('small', { s: 'opacity:0.5' }, 'связанный проект')
                                                        )


                                                    },
                                                    onSelect: function(res) {
                                                        it.dataset.id = res.id;

                                                        app.fetch('ajax/task_rel_project_set.php', { id_task: d.id, id_project: res.id > 0 ? res.id : 'NULL' }, 'POST', 'text').then(res => {
                                                            app.msg('Связанный проект установлен', 1)
                                                            updateTaskByKey(id_task, 'project', res.name);
                                                        })

                                                    }
                                                })

                                                aCom.search('%');
                                                it.select();
                                                it.focus();
                                                it.dataset.autocompleteOn = 1;
                                            })
                                    }
                                }
                            }))





                            el.append(form._form);
                        })
                    break;
            }

        }

        loadTab( /*location.hash.substr(1) ||*/ 'base');
        $("#task_settings_tab_activators a").click(function(event) {

            event.preventDefault();
            loadTab(this.dataset.id)

            return false;
        })
    })()

}
