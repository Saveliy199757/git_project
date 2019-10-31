if (!app.tasks) { app.tasks = {}; }
app.tasks.add = function(param, callback) {
	var startCreateCallTime = new Date().getTime() / 1000;
    var existsCount = document.querySelectorAll('.task-add').length;
    var searchFunc = function(term) {

        }
        /* Fields */
    var idProject, idContact, idAssignee, idRole, isFav, isRun, isEnd;
    let idsContacts = [];

    window.getListContacts121 = function() {
        console.log(idContact, idsContacts); // FIXME: удалить этот console.log
    }

    // Constructors
    var Project = function(x) {
        return crEl('li', { c: 'project-list-item' },
            crEl('a', { href: 'javascript:void(0)', title: x.name, e: { click: function() { setProject(x); changeScrollHeight('0px') } } },
                crEl('div', x.name)
                //crEl('small',{title:x.email},  x.email)
            )
        );
    }
    var Contact = function(x) {
        return crEl('li',
            crEl('a', { href: 'javascript:void(0)', title: x.name, e: { click: function() { setContact(x); changeScrollHeight('0px') } } },
                x.photo ? new app.constructor.Avatar(x.photo, x.name, { width: 24, height: 24, c: 'img-circle avatar' }) : new MIcon('person'),
                crEl('div', compressFio(x.name)),
                crEl('small', { title: x.email }, x.email)
            )
        );
    }

    function insertContactList() {
        if (param && param.contacts) {
            return param.contacts.map(x => {
                return new ContactList(x);
            });
        }
    }


    let ContactList = function(d) {
        let container = crEl('div', { c: 'task-add-contact', data: {id: d.id} });
        container.appendChild(crEl('div', d.name));
        idsContacts.push(d.id);
        // if (d.job || d.contragent) { contact.appendChild(crEl('small', d.job || '' + ' ' + d.contragent || '')); }

        container.appendChild(crEl('a', {
            href: 'javascript:void(0)',
            title: 'Удалить/Изменить',
            e: {
                click: function() {
                    container.remove();
                    let pos = idsContacts.indexOf(d.id);
                    if (pos >= 0) {
                        idsContacts.splice(pos, 1);
                    }
                }
            }
        }, new MIcon('clear')));
        return container;
    }

    let btnAddMeContact = new Btn({ c: 'btn-xs btn-white', title: 'Добавить себя в качестве контактного лица',
                e: {'click': function(e) {
                    e.preventDefault();
                    if (app.user && app.user.guest == 0) {
                        th = this;
                        app.fetch(app.root + 'ajax/contact_by_user.php', { user: app.user.id })
                            .then(function(d) {
                                if (typeof(d.id) !== 'undefined' && d.id !== '0') {
                                    if (!idContact) {
                                        setContact({id: d.id});
                                        th.remove();
                                    } else if (idContact != d.id) {
                                        let el = new ContactList({id: d.id, name: d.name});
                                        wrapperForContacts.appendChild(el);
                                        th.remove();
                                    } else {
                                        contact.animate('bounceIn')
                                        app.msg("Вы уже добавлены как основное контактное лицо");
                                    }
                                }
                            });
                    }
                }
    }}, 'Добавить себя контактом');

    var getProjects = function(id_contact, canset) {
        console.log('getProjects', id_contact, canset);
        return new Promise(function(a, b) {
            var q = searchProject.value.trim();
            var url = id_contact ? (app.root + 'ajax/projects_by_contact.php') : (app.root + 'ajax/autocompleteProjects.php');
            var params = id_contact ? { id: id_contact, limit: 5 } : { term: q, pid: idProject };
            app.fetch(url, params)
                .then(function(projects) {
                    if (projects.length && !idProject) {
                        if (canset && projects.length === 1) {
                            setProject(projects[0]);
                            return;
                        } 
                        searchRes.empty();
                        $(searchRes).parent().css('margin-top','75px');
                        searchRes.appendChild(crEl('header', { c: 'header' }, 'Проекты'));
                        projects.forEach(function(x) {
                            searchRes.appendChild(new Project(x));
                        })
                    }
                    a();
                });
        })
    }
    var getContacts = function(id_project, canset) {
        return new Promise(function(a, b) {
            var q = searchContact.value.trim();
            var url = id_project ? (app.root + 'ajax/contacts_by_project.php') : (app.root + 'ajax/autocomplete.contacts.forQickAddTask.php');
            var params = id_project ? { id: id_project, limit: 5 } : { term: q, pid: idProject };
            app.fetch(url, params)
                .then(function(contacts) {
                    
                    if (contacts.length && !idContact) {
                        if (canset && contacts.length === 1) {
                            setContact(contacts[0])
                        }
                        searchRes.empty();
                        $(searchRes).parent().css('margin-top','40px');
                        searchRes.appendChild(crEl('header', { c: 'header' }, 'Контакты'));
                        contacts.forEach(function(x) {
                            searchRes.appendChild(new Contact(x));
                        })
                    }
                });
        })
    }
    
    var setProject = function(data) {
        idProject = data.id;
        $(searchProject).val(data.name);
        $(searchProject).addClass('disable');
        project.empty()
        project.appendChild(new app.constructor.Avatar(data.photo, data.name, { width: 72, height: 72, c: 'img-circle avatar' }))
        project.appendChild(crEl('h1', data.name));

        if (typeof data.main_assignee_id !== 'undefined' && data.main_assignee_id != '0') {
            idAssignee = data.main_assignee_id;
            assignee.value = data.main_assignee_name;

            let urlphoto = 'files/storage/users/m.jpg';
            if (data.main_assignee_photo != '') {
                urlphoto = data.main_assignee_photo
            }
            assignee.style.backgroundImage = 'url(' + app.server + urlphoto + ')';
        }

        project.appendChild(crEl('a', {
            href: 'javascript:void(0)',
            title: 'Удалить/Изменить',
            e: {
                click: function() {
                    $(searchProject).click();
                }
            }
        }, new MIcon('clear')));

        project.animate('fadeIn');               
		if (!idContact) {
			searchContact.value = '';
			searchContact.focus();
			searchRes.empty();
			getContacts(data.id, true);
		} else if (leftFooter.querySelector('.task-add-select-module')) {
			$(leftFooter.querySelector('.task-add-select-module')).trigger('chosen:open');
		} else {
			searchRes.empty();
			name.focus()
		}

    }
	
	const categories = crEl('div', {c: 'task-add-left-footer task-add-category'}),
		subdivision = crEl('div', {c: 'task-add-left-footer task-add-subdivision', s: 'margin-top: 15px;'});
	let idCategory = idSubdivision = null, 
		oldIdCategory = null;

	app.fetch(app.root + 'ajax/get_tags.php', { is_module: 1 }, 'post')
		.then(function(d) {
			if (d.length > 0) {
				app.modules.use('chosen')
					.then(function() {
						const moduleSelect = crEl('select', { multiple: true, style: 'width:100%;', c: 'task-add-select-module', e: {
							change: (e) => {
								if (idCategory !== null) {
									moduleSelect.parentElement.querySelector('.search-choice-close').click();
								}
								idCategory = parseInt(moduleSelect.value);
								if (moduleSelect.parentElement.querySelector('.search-choice') === null) {
                                    idCategory = null;
                                }
								if (oldIdCategory !== idCategory && idCategory !== null) {
									// Получение и установка предустановленных параметров категории
									app.modules.use('app.tasks.getParams').
										then((data) => {
											app.tasks.getParams(parseInt(moduleSelect.value)).then( function(res) {
												if (res) {
                                                    const { project, project_name, role, role_name } = res;
                                                    if (role && !idRole) {
                                                        idRole = role;
                                                        idAssignee = null;
                                                        assignee.value = role_name;
                                                    }
                                                    
                                                    if (!project || !project_name || idProject) return;
                                                    setProject({
														id: project,
														name: project_name,
														main_assignee_id: idAssignee ? idAssignee : undefined,
														main_assignee_name: assignee.value
													});
													changeScrollHeight('0px');
												}
											})
										});
								}
								oldIdCategory = idCategory;
							}
						} });
						for (var i = 0, l = d.length; i < l; i++) {
							moduleSelect.appendChild(crEl('option', { value: d[i].id }, d[i].name));
						}
						categories.appendChild(moduleSelect);
						$(moduleSelect).chosen({
							placeholder_text_multiple: "Категория",
							search_contains: true,
							width: '100%'
						});
						
						$(addTaskWin).find('.task-add-select-module+.chosen-container>.chosen-choices').tooltip({
							html: true,
							placement: 'left',
							title: 'Выбрать категорию'
						})

					})

			}
        });
        
	app.fetch(app.root + 'ajax/get_tags.php', { is_module: 2 }, 'post')
		.then(function(d) {
			if (d.length > 0) {
				app.modules.use('chosen')
					.then(function() {
						const moduleSelect = crEl('select', { multiple: true, style: 'width:100%;', c: 'task-add-select-module', e: {
							change: (e) => {                                                                                       
								if (idSubdivision !== null) {
                                    moduleSelect.parentElement.querySelector('.search-choice-close').click();
                                } 
                                if (moduleSelect.value && idSubdivision != moduleSelect.value) {
                                    //Изменение подразделения контакта                                    
                                    app.fetch(app.root + 'ajax/contact_edit.php', { id_contact: idContact, idSubdivisionId: moduleSelect.value, idSubdivisionId_Old:idSubdivision}, 'post')
                                    .then(function(result) {
                                        console.log(result);
                                    });
                                } else if(idSubdivision && !moduleSelect.value){
                                    //Удаление подразделения контакта
                                    app.fetch(app.root + 'ajax/contact_edit.php', { id_contact: idContact, SubdivisionId_Delete: "1", idSubdivisionId_Old:idSubdivision}, 'post')
                                    .then(function(result) {
                                        console.log(result);
                                    });
                                } 

                                idSubdivision = parseInt(moduleSelect.value);
								if (moduleSelect.parentElement.querySelector('.search-choice') === null) {
									idSubdivision = null;
                                }  
                                                         
							}
						} });
						for (var i = 0, l = d.length; i < l; i++) {
							moduleSelect.appendChild(crEl('option', { value: d[i].id }, d[i].name));
                        }
                        subdivision.appendChild(moduleSelect);                        
						$(moduleSelect).chosen({
							placeholder_text_multiple: "Подразделение",
							search_contains: true,
							width: '100%'
						});
						
						$(addTaskWin).find('.task-add-select-module+.chosen-container>.chosen-choices').tooltip({
							html: true,
							placement: 'left',
							title: 'Выбрать подразделение'
						})
					})

			}
		});

	function changeScrollHeight(value) {
        $(searchRes).slimScroll({
            height: value,
            opacity: 0.4
        });
	}

    var setContact = function(data) {
        idContact = data.id;
        $(searchContact).val(data.name); 
        $(searchContact).addClass('disable');    
        let pos = idsContacts.indexOf(idContact);
        if (pos >= 0) {
            idsContacts.splice(pos, 1);
            let elContact = wrapperForContacts.querySelector('.task-add-contact[data-id="' + idContact + '"]');
        }

        app.fetch(app.root + 'ajax/contact_info.php', { id: data.id })
            .then(function(d) {
                let phoneEdited=false;
                if (!d.phone) d.phone='';
                contact.empty();
                contact.dataset.id = data.id;
                contact.appendChild(crEl('div', d.name));
                contact.appendChild(crEl('div', d.email));
                contact.appendChild(crEl('div', 
                                        crEl('input', { c: 'phoneEdit' , placeholder: 'Номер телефона отсутствует', value : d.phone , e:{
                                            keyup : function (event){
                                                if(event.keyCode === 13) $(this).blur(); else phoneEdited=true;
                                            },
                                            blur: function (event){
                                                if (!phoneEdited) return;
                                                let input=this; 
                                                phoneEdited=false;
                                                //Изменение телефона контакта
                                                let result = new Promise (
                                                    (resolve, reject) => {
                                                        let phoneData;
                                                        if (!this.value) phoneData='delete'; else phoneData=this.value;
                                                        app.fetch(app.root + 'ajax/contact_edit.php', { id_contact: idContact, phone: phoneData}, 'post')
                                                        .then(function(result) {
                                                            if(result){
                                                                resolve(result);									
                                                            } else {
                                                                reject(result);
                                                            }	
                                                        }).catch(error => reject(error));
                                                }).then(
                                                    result => {
                                                        $(input).parent().append("<i class='fa fa-check' aria-hidden='true'></i>");                                                        
                                                    },
                                                    error => {
                                                        $(input).parent().append("<i class='fa fa-times' aria-hidden='true'></i>");
                                                        console.log(error);
                                                    },
                                                    setTimeout(function(){
                                                        if ($(input).parent().find("i").length > 0) {
                                                            $(input).parent().find("i").remove();
                                                        }
                                                    }, 3000)
                                                );
                                            }
                                        }} , d.phone)));
                if (d.job || d.contragent) { contact.appendChild(crEl('small', d.job || '' + ' ' + d.contragent || '')); }

                contact.appendChild(crEl('a', {
                    href: 'javascript:void(0)',
                    title: 'Удалить/Изменить',
                    e: {
                        click: function() {
							$(searchContact).click();
                        }
                    }
                }, new MIcon('clear')));
                contact.animate('fadeInUp');                
                if (!idProject) {
                    searchProject.value = '';
                    searchProject.focus();
                    searchRes.empty();
                    console.log('Contact are selected');
                    getProjects(data.id, true);
                } else if (leftFooter.querySelector('.task-add-select-module')) {
                    searchRes.empty();
                    $(leftFooter.querySelector('.task-add-select-module')).trigger('chosen:open');
                } else {
                    searchRes.empty();
                    setTimeout(function() { name.focus() }, 1);
                    //console.log(name);
                }


                if (leftFooter && !leftFooter.querySelector('.task-add-tags')) {
                    var taginput = crEl('input', { type: 'text', placeholder: 'Добавить тег', title: 'Добавить тег', c: 'task-add-tags-input' }),
                        tagslist = crEl('div', { c: 'task-add-tags-list' });
                    taginput.onfocus = function() {
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
                                            app.fetch(app.root + 'ajax/autocomplete.tags.php', { term: term })
                                                .then(function(d) { cb(d); })
                                        },
                                        onSelect: function(res) {
                                            let ex = tagslist.querySelector(".tag[data-id='" + res.id + "']");
                                            if (ex) {
                                                app.msg("Уже есть")
                                                ex.animate('bounceIn')
                                            } else {
                                                let tag = new app.constructor.Tag(res.id, res.name);
                                                tagslist.appendChild(tag);
                                                tag.animate('fadeInUp')
                                                it.value = '';
                                                it.focus();
                                            }

                                            console.log(res);
                                        },
                                        noFound: function(name) {

                                            return crEl('li', {
                                                e: {
                                                    click: function() {
                                                        app.fetch(app.root + 'ajax/dialog.tag.add.php', { name: name }, 'POST')
                                                            .then(function(d) {
                                                                if (d && d.success) {
                                                                    let tag = new app.constructor.Tag(d.id, name);
                                                                    tagslist.appendChild(tag);
                                                                    tag.animate('fadeInUp')
                                                                    it.value = '';
                                                                    aCom._close()
                                                                    it.focus();
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
                                    taginput.focus()
                                    return;


                                })
                        }

                    }
                    leftFooter.appendChild(crEl('label', { c: 'task-add-tags-container task-add-tags', s: 'margin-top: 10px;', title: 'Теги' },
                        tagslist, taginput
                    ))
                    $(tagslist).tooltip({
                        html: true,
                        placement: 'left',
                        title: 'Теги'
                    })

                }
                app.fetch(app.root + 'ajax/contact_tags_load.php', { id: idContact })
                    .then(function(d) {
                        tagslist = tagslist || leftFooter.querySelector('.task-add-tags-list');
                        if (d && d.length > 0) {
                            for (var i = 0; i < d.length; i++) {
                                if (d[i].is_module=="2") {
                                    $(subdivision).find('.task-add-select-module').val(d[i].id).trigger("chosen:updated");
                                    idSubdivision=d[i].id;
                                } else {
                                    if (!$(tagslist).find(".tag[data-id='" + d[i].id + "']").length) {
                                        let tag = new app.constructor.Tag(d[i].id, d[i].name);                                  
                                        tagslist.appendChild(tag);
                                        tag.animate('slideInDown');                                                                                                                                            
                                    } else {
                                        $(tagslist).find(".tag[data-id='" + d[i].id + "']").get(0).animate('rubberBand')
                                    }
                                }
                            }
                        }
                    });


            })

    }



    var uploadFiles = function(files) {

        var http = new XMLHttpRequest();
        http.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                $.parseJSON(this.response).forEach(function(x) { filesList.appendChild(new app.constructor.Attachment(x, true)) });
            }
        }

        var form = new FormData();
        form.append('path', ''); // корневой путь.
        for (var i = 0; i < files.length; i++) { form.append('file[]', files[i]); }
        http.open('POST', app.root + 'files/upload_several.php');
        http.send(form);
    }




    var
        searchContact = crEl('input', { c: 'form-control task-add-search', s: 'margin-top: 25px', placeholder: 'Контакт' }),
        searchProject = crEl('input', { c: 'form-control task-add-search', placeholder: 'Проект' }),
        searchRes = crEl('ul', { c: 'task-add-search-result' }, ''),
        leftFooter = crEl('div', { c: 'task-add-left-footer' }),
        title = crEl('a', { href: 'javascript:void(0)', d: { type: 0 } }, crEl('span', 'Задача'), new MIcon('keyboard_arrow_down', 'md-18')),
        assignee = crEl('input', { c: 'form-control task-add-assignee', placeholder: 'Кому назначить', title: 'Ответственный за выполнение задачи' }),

        doc_num = crEl('input', { c: 'form-control task-add-doc-num', placeholder: 'Номер документа', title: 'Номер документа' }),
        doc_date = crEl('input', { c: 'form-control task-add-doc-date', placeholder: 'Дата', title: 'Дата документа' }),
        doc_amount = crEl('input', { c: 'form-control task-add-doc-amount', type: 'number', step: 0.01, placeholder: 'Сумма', title: 'Сумма' }),

        place = crEl('input', { c: 'form-control task-add-place', placeholder: 'Место встречи', title: 'Место встречи' }),
        name = crEl('input', { c: 'form-control  task-add-name', placeholder: 'Тема', title: 'Наименование задачи' }),
        desc = crEl('div', { c: 'form-control editor', placeholder: 'Описание' }),
        project = crEl('div', { c: 'task-add-project', s: 'margin-top: 40px' }),
        contact = crEl('div', { c: 'task-add-contact', s: 'margin-top: 0px;' }),
        wrapperForContacts = crEl('div', {c: 'wrapper_contacts', s: 'margin-top: 10px'}, contact, insertContactList()),
        dateInp = crEl('input', { c: 'form-control task-add-date', type: 'text', title: 'Дата и срок задачи', placeholder: 'Дата' }),
        createBtn = crEl('button', { c: 'btn btn-primary', s: 'padding-right:4px' }, 'Создать')



    /* Buttons */


    var
        priorityBtn = crEl('a', { href: 'javascript:void(0)', d: { originalTitle: 'Изменить приоритет', priority: 2, toggle: 'dropdown' }, c: 'btn btn-tooltip priority-btn' }, new MIcon('equalizer', 'md-18')),
        attachBtn = crEl('a', { href: 'javascript:void(0)', d: { originalTitle: 'Прикрепить файл' }, c: 'btn btn-tooltip', e: { click: function() { fileInput.click() } } }, new MIcon('\uE226', 'md-18')),
        fileInput = crEl('input', { type: 'file', s: 'position: fixed; top: -100em', multiple: true })
    filesList = crEl('div', { c: 'tasks-add-fileslist' }),
        prioritiesList = crEl('ul', { c: 'dropdown-menu' })

    //title.appendChild(settingsBtn)
    var addTaskWin = crEl('div', { c: 'task-add', s: 'right:' + (24 + (existsCount * 56)) + 'px' },
        crEl('div', { c: 'task-add-panel' },
            crEl('div', { c: 'task-add-header' }, //'Добавление задачи '+existsCount,
				categories,
                crEl('div', { c:'contactDiv'}, searchContact),
                crEl('div', { c:'projectDiv'}, searchProject),
                searchRes,
				wrapperForContacts,
				subdivision,
                project,
                leftFooter
            ),
            crEl('div', {
                    c: 'task-add-body',
                    e: {
                        dragover: function(event) {
                            event.preventDefault();
                            $(this).addClass('drag-over');
                            return false;
                        },
                        dragleave: function(event) {
                            event.preventDefault();
                            $(this).removeClass('drag-over');
                            return false;
                        },
                        drop: function(event) {
                            event.preventDefault();
                            $(this).removeClass('drag-over');
                            uploadFiles(event.dataTransfer.files);
                            return false;
                        }
                    }
                },

                crEl('div', { c: 'task-body-header' },
                    crEl('h1', title)
                ), //end task-body-header
                crEl('div', { c: 'form-group task-add-document-fields-group' },
                    doc_num,
                    doc_date,
                    doc_amount
                ),
                crEl('div', { c: 'form-group task-add-assignee-date-input-group' },
                    crEl('div', { c: 'task-add-assignee-container' }, assignee, btnAddMeContact),
                    dateInp,
                    new Btn({ c: 'btn-xs btn-white task-add-date-ext', title: 'Загруженность исполнителя' }, new Icon('angle-right'))
                ),
                crEl('div', { c: 'form-group task-add-place-input-group' }, place),
                crEl('div', { c: 'form-group' }, name),
                crEl('div', { c: 'form-group new-task-decription-container' }, desc),
                fileInput,
                filesList,
                crEl('div', { c: 'task-add-footer' },
                    crEl('div', { c: 'btn-group pull-right dropdown' },
                        createBtn,
                        crEl('button', { c: 'btn btn-primary dropdown-toggle', d: { toggle: 'dropdown' } }, crEl('span', { c: 'caret' })),
                        crEl('ul', { c: 'dropdown-menu' },
                            crEl('li', crEl('a', {
                                href: 'javascript:void(0)',
                                onclick: function() {
                                    isRun = 1;
                                    createBtn.click();
                                }
                            }, new Icon('play', { c: 'm-r-sm' }), 'Создать и приступить к работе')),
                            crEl('li', crEl('a', {
                                href: 'javascript:void(0)',
                                onclick: function() {
                                    isFav = 1;
                                    createBtn.click();
                                }
                            }, new Icon('star', { c: 'm-r-sm' }), 'Создать и добавить в избранное')),
							crEl('li', crEl('a', {
								href: 'javascript:void(0)',
								onclick: () => {
									isEnd = 1;
									createBtn.click();
								}
							}, new Icon('stop', { c: 'm-r-sm' }), 'Создать и завершить'))
                        ) /**/
                    ),

                    crEl('div',
                        crEl('div', { c: 'add-tasks-settings dropdown' }, priorityBtn, attachBtn, prioritiesList),
                        crEl('div', { c: 'editor-toolbar' },
                            crEl('a', { href: 'javascript:void(0)', c: 'btn', action: 'bold' }, new MIcon('\uE238', 'md-18')),
                            crEl('a', { href: 'javascript:void(0)', c: 'btn', action: 'italic' }, new MIcon('\uE23F', 'md-18')),
                            crEl('a', { href: 'javascript:void(0)', c: 'btn', action: 'underline' }, new MIcon('\uE249', 'md-18')),
                            crEl('a', { href: 'javascript:void(0)', c: 'btn', action: 'insertUnorderedList' }, new MIcon('format_list_bulleted', 'md-18')),
                            crEl('a', { href: 'javascript:void(0)', c: 'btn', action: 'insertOrderedList' }, new MIcon('format_list_numbered', 'md-18')),
                            crEl('a', { href: 'javascript:void(0)', c: 'btn', action: 'createLink' }, new MIcon('\uE250', 'md-18'))
                        )

                    )
                )

            )


        )
    )

    app.modal({
        animation: 'zoomIn',
        modalClass: 'modal-lg',
        bodyClass: 'no-padding',
        body: addTaskWin
    }).then(function(id) {


        if ((!app.user || app.user.guest == 0)) {
            app.fetch(app.root + 'ajax/user.php')
                .then(function(data) {
                    assignee.style.backgroundImage = 'url(' + app.server + data.photo + ')';
                    assignee.value = data.name;
                    idAssignee = data.id;
                })
        } else {
            assignee.value = 'Автоматически'
            assignee.style.backgroundImage = 'url(' + app.server + 'files/storage/users/m.jpg' + ')';
            idAssignee = 0;

            app.fetch(app.root + 'ajax/dialog.QickAddTask.default.php')
                .then((res) => {
                    if (res && res.contact) {
                        setContact(res.contact)
                    }
                })


            assignee.disabled = true;


        }
        addTaskWin.querySelector('.task-add-date-ext').style.display = app.user.guest == 1 ? 'none' : '';
        addTaskWin.querySelector('.task-add-date-ext').addEventListener('click', function(e) {
            if (e) {


                if (e.ctrlKey) {
                    app.modules.use('app.assigneeLoading').then(() => {
                        app.assigneeLoading({ id: idAssignee, name: assignee.value })
                    })
                    return false;
                }


                let md = $('#' + id + ' .modal-dialog');
                //	md.animate({marginLeft:100});
                let th = this;
                this.classList.toggle('btn-info');
                let e1 = th.querySelector('.fa');
                e1.classList.toggle('fa-angle-right')
                e1.classList.toggle('fa-angle-left')
                if (!this.classList.contains('btn-info')) {
                    $("#add-task-deadline-helper-M").remove();
                    md.css({ marginLeft: 'auto' });
                    return false;
                } else {
                    md.animate({ marginLeft: 100 });
                }
                $(this).blur()
                e.preventDefault();
                e.stopPropagation();
                let el = $('#' + id + '_body');
                let offs = el.offset();

                $("#add-task-deadline-helper-M").remove();
                let contentBody = new crEl;
                addTaskWin.append(crEl({
                        id: 'add-task-deadline-helper-M',
                        c: 'add-task-deadline-helper',
                        s: {
                            backgroundColor: '#f8f8f8',
                            height: el.height() + 'px',
                            width: (offs.left + (offs.left - 200)) + 'px',
                            position: 'fixed',
                            top: 0,
                            left: (el.width()) + 'px',
                        }
                    },
                    contentBody
                ));

                app.modules.use('app.assigneeLoading').then(() => {
                    app.assigneeLoading({ id: idAssignee, name: assignee.value }, contentBody).then(() => {
                        let fh = document.getElementById('add-task-deadline-helper-M').querySelector('h2');
                        if (!fh.querySelector('button')) {
                            fh.appendChild(new Btn({ c: 'close pull-right' }, '×', () => {
                                th.dispatchEvent(new Event('click'))
                            }))
                        }
                    })
                })



                return false;

            }
        });


        if (param) {
            /*обработка пришедших параметров*/
            if (param.attachments && param.attachments.length) {
                console.log(param.attachments)
                param.attachments.forEach(function(k) { filesList.appendChild(new app.constructor.Attachment(k, true)) })
            }

            if (param.project) {
                setProject(param.project);
            }

            if (param.contact) {
                setContact(param.contact);
            }


            if (param.description_html && param.description_html.length) {
                desc.innerHTML = param.description_html;
            } else if (param.description && param.description.length) {
                desc.innerHTML = param.description;
            }

            if (param.name && param.name.length) {
                name.value = param.name;
            }


            if (param.id_parent && param.id_parent > 0) {
                //task-body-header
                var pt = crEl('small', { placeholder: '', s: 'line-height: 30px;font-size: 10px;', c: 'pull-right' }, '#' + param.id_parent)
                title.appendChild(pt)
                $(pt).tooltip({
                    html: true,
                    placement: 'bottom',
                    title: 'Подзадача для задачи #' + param.id_parent
                })

            }

        }

        // if (!idProject && !idContact) {
        //     app.fetch(app.root + 'ajax/task_add_popular_recipients.php')
        //         .then(function(data) {
        //             searchRes.empty();
        //             searchRes.appendChild(crEl('header', { c: 'header' }, 'Проекты'));                    
        //             data.forEach(function(x) {
        //                 searchRes.appendChild(crEl('li', { c: 'task-add-combine-list-item' },
        //                     crEl('a', {
        //                             href: 'javascript:void(0)',
        //                             title: x.name,
        //                             e: {
        //                                 click: function() {
        //                                     setProject(x.project);
        //                                     setContact(x.contact);
		// 									if (searchRes.children.length === 0) {
		// 										changeScrollHeight('0px');
		// 									}
        //                                 }
        //                             },
		// 							s: { color: 'white' }
        //                         },
        //                         new MIcon('star_border'),
        //                         crEl('div', x.project.name),
        //                         crEl('small', { title: x.contact.name }, x.contact.name)
        //                     )
        //                 ))
        //             })
        //         })
        // }



        if (!idProject && !((!app.user || app.user.guest == 0))) {
            app.fetch(app.root + 'ajax/autocompleteProjects.php?term=%').then(r => {
                if (r.length == 1) {
                    setProject(r[0])
                }
            })
        }


        function toggleType(id, callback) {




            console.log('toggle type', id);
            addTaskWin.classList.remove('task-add-meeting');
            addTaskWin.classList.remove('task-add-doc');

            title.dataset.type = id

            if (id != -1) {
                var d1 = param && param.meeting && param.meeting.d1 ? (new Date(param.meeting.d1 * 1000)) : $(dateInp).data('daterangepicker').startDate,
                    d2 = param && param.meeting && param.meeting.d2 ? (new Date(param.meeting.d2 * 1000)) : $(dateInp).data('daterangepicker').endDate
                $(dateInp).daterangepicker({
                    startDate: d1,
                    endDate: d2,
                    locale: {
                        format: 'dd D MMM'
                    },
                    singleDatePicker: false,
                    ranges: {
                        'Сегодня': [moment(), moment()],
                        'До завтра': [moment(), moment().add(1, 'days')],
                        'До конца недели': [moment(), moment().endOf('week')],
                        'До конца месяца': [moment(), moment().endOf('month')]

                    }
                })

                // console.info("meeting Dates ", d1, d2)


            }

            $("#meetingSyncToggler").remove()
            if (id == 0) {

            } else if (id > 0) {
                addTaskWin.classList.add('task-add-doc');
                app.modules.use('datepicker').then(function() {

                    var el = addTaskWin.querySelector('.task-add-doc-date');
                    $(el).datepicker();
                })
                $(addTaskWin.querySelector('.task-add-doc-num')).focus();
            } else if (id == -1) {

                function setSyncToggler() {
                    console.log(arguments)
                    let pt = document.getElementById("meetingSyncToggler");
                    _f = function(data) {

                        if (data && data.id > 0) {
                            pt.innerHTML = ''
                            pt.style.color = '#1ab394';
                            pt.appendChild(new MIcon('cloud_done', { s: 'opacity:1' }));
                            pt.title = 'Созданная встреча\nбудет синхронизирована\nс календарем "' + data.name + '"'
                            pt.dataset.id = data.id;
                            pt.dataset.id_service = data.id_service;
                        } else {
                            pt.innerHTML = ''
                            pt.style.color = 'inherit';
                            pt.appendChild(new MIcon('cloud_queue'))
                            pt.title = 'Cинхронизация с календарем не настроена. \nНажмите чтобы настроить'
                            pt.dataset.id = '';
                            pt.dataset.id_service = '';
                        }
                    }

                    if (!arguments.length) {
                        app.fetch(app.root + 'ajax/service_calendar_is_one.php').then(_f)
                    } else {
                        _f(arguments[0])
                    }

                }

                addTaskWin.classList.add('task-add-meeting');
                var t = new Date().getTime();

                app.modules.use('daterangepicker').then(function() {
                    $(dateInp).daterangepicker({
                        startDate: param && param.meeting && param.meeting.d1 ? (new Date(param.meeting.d1 * 1000)) : new Date(t),
                        endDate: param && param.meeting && param.meeting.d2 ? (new Date(param.meeting.d2 * 1000)) : new Date(t + 3600000),
                        timePicker: true,
                        timePicker24Hour: true,
                        timePickerIncrement: 10,
                        locale: {
                            format: 'dd DD MMM HH:mm',
                            separator: '     —     '
                        },
                        singleDatePicker: false
                    })
                })

                var pt = crEl('small', {
                    placeholder: '',
                    s: 'line-height: 30px;font-size: 10px;',
                    c: 'pull-right',
                    id: 'meetingSyncToggler',
                    e: {
                        click: function(e) {
                            e.stopPropagation();


                            var el = addTaskWin.querySelector('.task-add-body');
                            var th = this;
                            var w = $(el).outerWidth();
                            var h = $(el).height();
                            if (!addTaskWin.querySelector('.task-meeting-sync')) {
                                var mm = crEl('div', { c: 'task-meeting-sync', s: 'width:' + w + 'px; height:' + h + 'px;' });

                                let _loadClaendars = function(list) {
                                    list.innerHTML = '';
                                    app.fetch(app.root + 'ajax/service_calendars_status.php')
                                        .then(function(res) {
                                            if (res && res.error) { app.error(res.error) }

                                            let syncEd = 0;



                                            res.forEach(function(ss) {

                                                ss.calendars.forEach(function(cal) {
                                                    let li = crEl('a', {
                                                            href: 'javascript:void(0)',
                                                            c: 'list-group-item',
                                                            e: {
                                                                click: function() {
                                                                    let pars = document.getElementById("meetingSyncParams");

                                                                    if (this.classList.contains('active')) {
                                                                        pars.classList.add('hide')
                                                                        this.classList.remove('active')
                                                                        pars.dataset.id_service = ''
                                                                        pars.dataset.id = ''
                                                                        pars.dataset.watcher_resource_id = ''
                                                                        setSyncToggler(false)
                                                                    } else {
                                                                        this.parentNode.querySelectorAll('.active').forEach(function(l) { l.classList.remove('active') })
                                                                        this.classList.add('active')
                                                                        pars.classList.remove('hide')
                                                                        pars.dataset.id_service = ss.id_service
                                                                        pars.dataset.id = cal.id
                                                                        pars.dataset.name = cal.name
                                                                        pars.dataset.watcher_resource_id = cal.watcher_resource_id
                                                                        document.getElementById("meetingSyncDefault").checked = cal.is_default == 1 && ss.is_default_calendar == 1
                                                                        document.getElementById("meetingSyncWatch").checked = (cal.watcher_resource_id && cal.watcher_resource_id.length)
                                                                        setSyncToggler({ id: cal.id, name: cal.name, id_service: ss.id_service })
                                                                    }


                                                                }
                                                            }
                                                        },

                                                        crEl('div', {},
                                                            crEl('div', { c: 'pull-left', s: ' margin-right:8px; line-height:40px; text-align:center' }, new MIcon('event', { s: 'font-size:40px;' })),
                                                            crEl('div', crEl('strong', cal.name)),
                                                            crEl('small', ss.login)
                                                        )
                                                    );



                                                    list.appendChild(li)
                                                    if (cal.is_default == 1 && ss.is_default_calendar == 1) {
                                                        li.dispatchEvent(new Event('click'))
                                                    }

                                                    syncEd++;
                                                })

                                            })


                                            if (syncEd === 0) {
                                                list.appendChild(crEl('a', {
                                                        href: 'javascript:void(0)',
                                                        c: 'list-group-item',
                                                        e: {
                                                            click: function() {

                                                                app.modules.use('app.profile.integrations.service')
                                                                    .then(function() {

                                                                        function _f(id_service) {
                                                                            app.profile.integrations.service.calendars.add(id_service, function() {
                                                                                _loadClaendars(document.getElementById("meetingAddCalendarsList"))
                                                                                setTimeout(function() {
                                                                                    document.getElementById("meetingAddCalendarsList").click()
                                                                                }, 500)
                                                                            })
                                                                        }

                                                                        app.profile.integrations.service.selectService(function(id, data) {
                                                                            if (id === 0) {
                                                                                app.modules.use('app.google')
                                                                                    .then(function() {
                                                                                        app.google.login('new')
                                                                                            .then(function() {
                                                                                                app.profile.integrations.service.selectService(function(id, data) {
                                                                                                    _f(id)
                                                                                                })
                                                                                            })
                                                                                    })
                                                                            } else {
                                                                                _f(id)
                                                                            }
                                                                        })
                                                                    })

                                                            }
                                                        }
                                                    },
                                                    new MIcon('add', { c: 'pull-left m-r md-18' }), "Добавить календарь"
                                                ))
                                            }




                                        })
                                }

                                let list = crEl('div', { c: 'list-group', id: 'meetingAddCalendarsList' })

                                mm.appendChild(crEl('div',

                                    crEl('div', { c: 'row-fluid' },
                                        crEl('div', { c: 'col-md-12' },
                                            crEl('h1', { s: 'font-size:1.8em; ' },
                                                crEl('a', {
                                                    c: 'pull-right',
                                                    href: 'javascript:void(0)',
                                                    e: {
                                                        click: function() {
                                                            $(addTaskWin.querySelector('.task-meeting-sync')).hide();
                                                        }
                                                    }
                                                }, new MIcon('close', { s: 'color:inherit' })),
                                                'Настройки синхронизации'
                                            )
                                        )
                                    ),
                                    crEl('div', { c: 'row-fluid' },
                                        crEl('div', { c: 'col-md-12' },
                                            crEl('p', 'Выберите календарь с которым необходимо синхронизировать встречу'),
                                            list,
                                            crEl('div', { id: 'meetingSyncParams', c: 'hide' },

                                                crEl('div', { c: 'row border-bottom' },
                                                    crEl('div', { c: 'col-md-12  m-b' },

                                                        crEl('label', { title: 'Отслеживать изменения в удаленном календаре и встрече и синхронизировать при изменении' },
                                                            new app.constructor.Check({
                                                                id: 'meetingSyncWatch',
                                                                e: {
                                                                    change: function() {
                                                                        let th = this;
                                                                        th.disabled = true;
                                                                        let helper = document.getElementById("meetingSyncWatchHelper")
                                                                        meetingSyncWatchHelper.innerHTML = 'Загрузка. Пожалуйста подождите...'
                                                                        app.modules.use('app.profile.integrations.service')
                                                                            .then(function() {
                                                                                app.profile.integrations.service.calendars.sync(document.getElementById("meetingSyncParams").dataset, function(res) {
                                                                                    th.disabled = false;
                                                                                    let is_on = (res.watcher && res.watcher.resourceId);
                                                                                    meetingSyncWatchHelper.innerHTML = is_on ? 'Вкл.' : 'Откл.'
                                                                                    app.msg("Режим отслеживания изменений " + ((res.watcher && res.watcher.resourceId) ? 'включен' : 'выключен'), 'success')
                                                                                    document.getElementById("meetingSyncParams").dataset.watcher_resource_id = is_on ? res.watcher.resourceId : ''
                                                                                })
                                                                            })
                                                                    }
                                                                }
                                                            }),
                                                            '\u00a0Следить за изменениями', crEl('small', { s: 'margin-left:16px; opacity:0.5', id: 'meetingSyncWatchHelper' })
                                                        ),
                                                        crEl('label', { title: 'Использовать этот календарь по умолчанию для всех создаваемых встреч' },
                                                            new app.constructor.Check({
                                                                id: 'meetingSyncDefault',
                                                                e: {
                                                                    change: function() {
                                                                        let pars = document.getElementById("meetingSyncParams");
                                                                        let id_service = pars.dataset.id_service;
                                                                        let id = pars.dataset.id;
                                                                        let th = this;
                                                                        app.modules.use('app.profile.integrations.service')
                                                                            .then(function() {
                                                                                app.profile.integrations.service.setDefaultForCalendars(id_service, th.checked, function() {
                                                                                    app.profile.integrations.service.calendars.setDefault(id, id_service, th.checked ? 1 : 0, function() {
                                                                                        if (th.checked) {
                                                                                            app.msg('Установлен как календарь по умолчанию для новых встреч', 'success')
                                                                                        } else {
                                                                                            app.msg('Календарь по умолчанию отключен', 'success')
                                                                                        }
                                                                                    })
                                                                                })
                                                                            })
                                                                    }
                                                                }
                                                            }),
                                                            '\u00a0Использовать по умолчанию'
                                                        )

                                                    )
                                                )
                                            ),

                                            crEl('div', { c: 'text-right m-t' },
                                                crEl('a', {
                                                    href: 'javascript:void(0)',
                                                    c: 'pull-left',
                                                    title: 'Обновить список календарей',
                                                    e: {
                                                        click: function() {
                                                            _loadClaendars(list)
                                                        }
                                                    }
                                                }, crEl('small', 'Обновить')),

                                                crEl('a', { href: 'javascript:void(0)', title: 'Откроется в новом окне\nУправление аккаунтами и синхронизацией', e: { click: function() { window.open(app.path + '#/profile/integrations') } } }, crEl('small', 'Управление аккаунтами \u00a0'), new MIcon('open_in_new', { s: 'font-size:12px' }))
                                            )

                                        )
                                    )
                                ))


                                _loadClaendars(list)



                                addTaskWin.appendChild(mm);

                            }
                            $(addTaskWin.querySelector('.task-meeting-sync')).show();







                        }
                    }
                }, '*')
                title.appendChild(pt)


                setSyncToggler()

                if (param && param.meeting && param.meeting.location) {
                    place.value = param.meeting.location || '';
                }

                if (param && param.meeting && param.meeting.summary) {
                    name.value = param.meeting.summary || '';
                }


                if (param && param.meeting && param.meeting.description) {
                    desc.innerHTML = param.meeting.description || '';
                }

                place.onfocus = function() {
                    var it = this;
                    if (!this.dataset.autocompleteOn) {
                        app.modules.use('fnn-autocomplete')
                            .then(function() {

                                let aCom = new fnnAutocomplete(it, {
                                    source: function(term, cb) {
                                        app.fetch(app.root + 'ajax/meeting_places.php', { term: term }).then(function(res) { cb(res); })
                                    },
                                    key: 'name',
                                    limit: 5,
                                    closeBtn: false,
                                    onSelect: function(res) {
                                        if (!idProject || !idContact) {
                                            searchContact.focus()
                                        } else {
                                            name.focus();
                                        }
                                    },
                                    render: function(data) {
                                        return crEl('li', { s: 'padding:4px 8px;' }, data.name);
                                    },
                                    noFound: function(name) {

                                        return crEl('li', name)
                                        it.close();
                                    }
                                })
                                aCom.search('%');
                                it.select();
                                it.focus();
                                it.dataset.autocompleteOn = 1;
                            })
                    }
                }

            }


        }




        fileInput.onchange = function() { uploadFiles(this.files); }

        app.modules.use('select2')
            .then(function() {

                $.getJSON(app.root + "ajax/priorities.php", null, function(priorities) {
                    prioritiesList.empty();
                    for (i = 0; i < priorities.length; i++) {
                        prioritiesList.appendChild(crEl('li', priorities[i].priority == 2 ? { c: 'active' } : null, crEl('a', {
                            href: 'javascript:void(0)',
                            e: {
                                click: (function(d) {
                                    return function() {
                                        this.parentNode.parentNode.querySelectorAll('li').forEach(function(k) { k.classList.remove('active') })
                                        this.parentNode.classList.add('active');
                                        var btn = this.parentNode.parentNode.parentNode.querySelector('.priority-btn');
                                        btn.style.backgroundColor = '#' + d.color;
                                        btn.dataset.originalTitle = "Приоритет<br><strong>" + d.name + "</strong>"
                                        btn.dataset.priority = d.priority;
                                    }
                                })(priorities[i])
                            }
                        }, priorities[i].name)))
                    }
                });




            })


        $('.btn-tooltip').tooltip({
            html: true,
            placement: 'top'
        })

        app.modules.use('daterangepicker', function() {
            $(dateInp).daterangepicker({
                startDate: new Date(),
                locale: {
                    format: 'dd D MMM',
                    separator: ' - ',
                    applyLabel: 'ОК',
                    cancelLabel: 'Отмена',
                    weekLabel: 'W',
                    customRangeLabel: 'Диапазон дат'
                },
                singleDatePicker: false,
                ranges: {
                    'Сегодня': [moment(), moment()],
                    'До завтра': [moment(), moment().add(1, 'days')],
                    'До конца недели': [moment(), moment().endOf('week')],
                    'До конца месяца': [moment(), moment().endOf('month')]

                }
            }).on('apply.daterangepicker', function(a, b) {
                console.log(moment(b.startDate).toDate(), moment(b.endDate).toDate())
            }).on('showCalendar.daterangepicker', function(ev, picker) {
                console.log('ev', ev)
                console.log('picker', picker)
            })

        })


        $(searchRes).slimScroll({
            height: 'auto',
            opacity: 0.4
        });

        title.onclick = function() {
            var el = addTaskWin.querySelector('.task-add-body');
            var th = this;
            var w = $(el).outerWidth();
            var h = $(el).height();
            if (!addTaskWin.querySelector('.task-add-types')) {
                var mm = crEl('div', { c: 'task-add-types' });
                addTaskWin.appendChild(mm);


                app.fetch(app.root + "ajax/document_types_load.php")
                    .then(function(data) {
                        var Li = function(d) {
                            return crEl('li', crEl('a', {
                                href: 'javascript:void(0)',
                                e: {
                                    click: function() {
                                        //alert(d.id);
                                        th.dataset.type = d.id;
                                        toggleType(d.id)
                                        $(th).find('span').text(d.name);
                                        $(th).trigger('click')
                                    }
                                }
                            }, d.name));
                        }
                        var list = crEl('ul')
                        for (var i = 0; i < data.length; i++) {
                            list.appendChild(new Li(data[i]));
                        }

                        var divv = crEl('div', { s: 'padding:8px 16px;  overflow-y:auto' },

                            crEl('ul', { c: 'main' },
                                new Li({ id: 0, name: 'Задача' }),
                                new Li({ id: -1, name: 'Встреча' }),
								new Li({ id: -2, name: 'Инцидент' }),
								new Li({ id: -3, name: 'Телефонный звонок' })
                            ),
                            list

                        );
                        mm.appendChild(divv);
                        $(divv).slimScroll({
                            height: '100%',
                            opacity: 0.4
                        });
                    })







            }

            if (!this.dataset.open || this.dataset.open == 0) {
                this.dataset.open = 1;
                this.querySelector('.material-icons').innerHTML = 'keyboard_arrow_up';
                addTaskWin.querySelector('.task-add-types');
                $(addTaskWin.querySelector('.task-add-types')).show();
                //addTaskWin.querySelector('.task-add-types').childNodes[0].scrollTop  = 0;
            } else {
                this.dataset.open = 0;
                this.querySelector('.material-icons').innerHTML = 'keyboard_arrow_down';
                $(addTaskWin.querySelector('.task-add-types')).hide();
            }

        }

        createBtn.onclick = function() {

            if (!idProject) { app.validateError(searchProject, 'Не выбран проект'); return false; }
            if (!idContact) { app.validateError(searchContact, 'Не выбран контакт'); return false; }
            //if(!idAssignee){ app.validateError(assignee,'Не выбран исполнитель'); return false;}
            //, idContact, idAssignee
            var getTags = function() {
                var res = [];
                addTaskWin.querySelectorAll('.task-add-tags-list .tag').forEach(function(k) {
                    res.push(k.dataset.id)
                })
                return res;
            }

            var getFiles = function() {
                var res = [];
                filesList.querySelectorAll('.attach').forEach(function(k) {
                    res.push(k.dataset.id)
                })
                return res;
            }


            /*
            	$name				=	$mysqli -> real_escape_string( stripslashes($data["name"]) );
            	$contact			=	intval( $data["contact"] );
            	$project			=	intval( $data["project"] );
            	$assignee 			=	isset($data["assignee"])?intval($data["assignee"]):un();
            	$owner 				=	isset($data["owner"])?intval($data["owner"]):un();
            	$duration			=	isset($data["duration"])?intval($data["duration"]):8;
            	$date				=	isset($data["date"])?intval($data["date"]):time() ;
            	$deadline			=	isset($data["deadline"])?intval($data["deadline"]):0;
            	$meeting			=	isset($data["meeting"])?intval($data["meeting"]):0;
            	$priority			=	isset($data["priority"])?intval($data["priority"]):2;
            	$meeting_duration	=	isset($data["meeting_duration"])?intval($data["meeting_duration"]):0;
            	$meeting_place		=	isset($data["meeting_place"])?$mysqli -> real_escape_string($data["meeting_place"]):'';
            	$meeting_time		=	isset($data["meeting_time"])?$mysqli -> real_escape_string($data["meeting_time"]):'08:00';
            	$meeting_time_end	=	isset($data["meeting_time_end"])?$mysqli -> real_escape_string($data["meeting_time_end"]):'17:00';
            	$uid 				=	isset($data["uid"])?$data["uid"]:'NULL';
            	$id_parent			=	isset($data["id_parent"])?intval($data["id_parent"]):0;
            	$id_prev			=	(isset($data["id_prev"]) &&  $data["id_prev"]>0 )?$data["id_prev"]:0;
            	$planned			=	(isset($data["planned"]) &&  $data["planned"]>0 )?$data["planned"]:0;
            	$desc				=	(isset($data["desc"]) && strlen($data["desc"])>0)?$mysqli -> real_escape_string( trim($data["desc"]) ):'';
            	$atta               =   (isset($data["attach"]))?$data['attach']:array();
            	$routestate			=	isset($data["routestate"])?intval($data["routestate"]):0;
            	$id_discussion		=	isset($data["discussion"])?intval($data["discussion"]):0;
            */



            var d1 = title.dataset.type == -1 ? $(dateInp).data('daterangepicker').startDate.toDate() : $(dateInp).data('daterangepicker').startDate.startOf('day').toDate(),
                d2 = title.dataset.type == -1 ? $(dateInp).data('daterangepicker').endDate.toDate() : $(dateInp).data('daterangepicker').endDate.endOf('day').toDate()

            let pos = idsContacts.indexOf(idContact);
            if (pos >= 0) {
                idsContacts.splice(pos, 1);
            }

            let nameStr = name.value.replace(/\n/g, '').replace(/\r/g, '');
            var data = {
                name: nameStr,
                contact: idContact,
                project: idProject,
                assignee: idAssignee,
				role: idRole,
				category: idCategory,
				subdivision: idSubdivision,
                desc: desc.innerHTML,
                tags: getTags(),
                date: +(d1.getTime() / 1000),
                deadline: +(d2.getTime() / 1000),
                priority: priorityBtn.dataset.priority || 2,
                atta: getFiles(),
                attach: getFiles(),
                favorite: isFav,
                idscontacts: idsContacts,
				markcomplete: isEnd
            };
			if (data.markcomplete === 1) {
				data.date_complete = new Date().getTime() / 1000;
				data.duration = ((data.date_complete - startCreateCallTime) / 60).toFixed(2);
			}
            if (param) {
                if (param.uid && param.uid.length) { data.uid = param.uid; }
                if (param.id_parent && param.id_parent > 0) { data.id_parent = param.id_parent; }
                if (param.id_prev && param.id_prev > 0) { data.id_prev = param.id_prev; }
                if (param.planned && param.planned > 0) { data.planned = param.planned; }
                if (param.routestate && param.routestate > 0) { data.routestate = param.routestate; }
                if (param.id_discussion && param.id_discussion > 0) { data.discussion = param.id_discussion; }
            }
            if (title.dataset.type == -1) {
                data.meeting = 1;
                data.meeting_time = if0(d1.getHours()) + ':' + if0(d1.getMinutes());
                data.meeting_time_end = if0(d2.getHours()) + ':' + if0(d2.getMinutes());
                data.meeting_duration = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60);
                data.meeting_place = place.value;
			}
			else if (title.dataset.type == -2) {
				data.incident = 1;
			}
			else if (title.dataset.type == -3) {
				data.call = 1;
			}
			else if (title.dataset.type > 0) {
                data.doctype = title.dataset.type;
                data.innumber = doc_num.value;
                data.indate = $(doc_date).datepicker("getDate").getTime() / 1000;
                data.intotal = doc_amount.value;
            }


            if (typeof(moduleSelect) != 'undefined' && moduleSelect) {
                $(moduleSelect).val().forEach(function(k) {
                    data.tags.push(k)
                })
            }


            this.disabled = true;


            var saveTask = function(d, callback) {
                console.log('Save task', d);
                app.fetch(app.root + "ajax/qick_add_task.php", d, "post").then(function(data) {
                    console.log('result', data);
                    if (data.success) {
						if (d.call === 1 || d.markcomplete === 1) {
							const callData = {
								id_task: data.id,
								start_time: startCreateCallTime
							};
							app.fetch(app.root + 'ajax/set_call_start_time.php', callData, 'post').
								then(dataForCall => {
									console.log('resultCall', dataForCall)
								});
						}
                        app.sendQueue();
                        if (isRun) {
                            let launched_timer_id = parseInt(ls.get('running_task')) || 0; // ID запущенного тайцмера или 0
                            if (launched_timer_id > 0) {
                                ls.unset('running_task')
                                app.timer.stop(launched_timer_id);
                            }

                            app.timer.start(data.id).then(function() {
                                if (typeof callback == 'function') {
                                    callback(data);
                                }
                            });

                        } else if (typeof callback == 'function') {
                            callback(data);
                        } else {
                            app.msg("Задача успешно добавлена", 'success')
                                .then(function(notify) {
                                    notify.addAction('Открыть задачу', function() {

                                        app.modules.use('app.tasks.quickView').then(() => {
                                            app.tasks.quickView(+data.id);
                                        })

                                    });

                                })
                            if (typeof(callback) == 'function') { callback() }

                            if (app.tasks.kanban && app.tasks.kanban.reload) { app.tasks.kanban.reload() }

                        }


                        let pt = document.getElementById("meetingSyncToggler");
                        if (pt && pt.dataset && pt.dataset.id && pt.dataset.id > 0) {
                            app.modules.use('app.google')
                                .then(function() {
                                    let scopes = ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar']
                                    _sync = function(res) {
                                        app.google.errorHook(res, scopes, _sync)
                                        if (res && res.error) { app.error(res.error); return false; }
                                        if (res && res.success) {
                                            app.msg("Встреча добавлена в календарь", "success");
                                        }
                                    }
                                    app.google.login(+pt.dataset.id_service, scopes)
                                        .then(function() {
                                            app.fetch(app.root + 'ajax/gmail/calendars_task_to_event.php', { id_task: data.id, id_calendar: pt.dataset.id }, 'POST')
                                                .then(_sync)
                                        })
                                })
                        }


                    }
                    $('#' + id).modal('hide');
                })
            }
			const getProjectUrl = `ajax/project_one.php`,
                projectId = { id: data.project },
                categoryError = () => { createBtn.disabled = false; app.error('Для выбранного проекта необходимо выбрать категорию!')},
				subdivisionError = () => { createBtn.disabled = false; app.error('Для выбранного проекта необходимо указать подразделение!') };
            
			if (data.doctype > 0 && (!data.uid || data.uid.length < 2)) {
                var md = {
                    type: data.doctype,
                    id_contact: data.contact,
                    name: data.name,
                    desc: data.desc,
                    files: data.attach,
                    idate: data.indate,
                    inumber: data.innumber,
                    total: data.intotal
                };
                console.log(data);
                app.fetch(app.root + "ajax/inbox_document_add.php", md, 'post', 'text').then(function(uid) {
					app.fetch(app.root + getProjectUrl, projectId).then(dataProject => {
						if (parseInt(dataProject.subdivision_is_required) === 1 && data.subdivision === null) {
							subdivisionError();
                        } else if (parseInt(dataProject.category_is_required) === 1 && data.category === null) {
                            categoryError();
                        }
                        else {
							data.uid = uid.trim();
							saveTask(data, callback);
							createBtn.disabled = false;
						}
					});
                })

            } else {
				app.fetch(app.root + getProjectUrl, projectId).then(dataProject => {
					if (parseInt(dataProject.subdivision_is_required) === 1 && data.subdivision === null) {
						subdivisionError();
					} else if (parseInt(dataProject.category_is_required) === 1 && data.category === null) {
                        categoryError();
                    } else {
						saveTask(data, callback);
					}
				});
            }

        }




        if (param) {
            /*обработка пришедших параметров*/
            if (param.attachments && param.attachments.length) {
                //console.log(param.attachments);
                filesList.innerHTML = '';
                param.attachments.forEach(function(k) { filesList.appendChild(new app.constructor.Attachment(k, true)) })
            }

            /*		if(param.project){
            			setProject(param.project);
            		}

            		if(param.contact){
            			console.log('initcontact', param)
            			setContact(param.contact);
            		}*/


            if (param.description_html && param.description_html.length) {
                desc.innerHTML = param.description_html;
            } else if (param.description && param.description.length) {
                desc.innerHTML = param.description;
            }

            if (param.name && param.name.length) {
                name.value = param.name;
            }


            if (param.id_parent && param.id_parent > 0) {
                //task-body-header
                var pt = crEl('small', { placeholder: '', s: 'line-height: 30px;font-size: 10px;', c: 'pull-right' }, '#' + param.id_parent)
                title.appendChild(pt)
                $(pt).tooltip({
                    html: true,
                    placement: 'bottom',
                    title: 'Подзадача для задачи #' + param.id_parent
                })

            }

			if (param.mode && param.mode === 'incident') {
				title.querySelector('span').innerHTML = 'Инцидент';
				toggleType(-2, () => {});
			}
			if (param.mode && param.mode === 'call') {
				title.querySelector('span').innerHTML = 'Телефонный звонок';
				toggleType(-3, () => {});
			}
            if (param.mode && param.mode === 'meeting') {
                title.querySelector('span').innerHTML = 'Встреча'
                setTimeout(function() {

                    toggleType(-1, function() {


                    });
                    if (place && param && param.place || param.location) { place.value = param.place || param.location }


                    if (dateInp) {
                        if (param && param.d1) { $(dateInp).data('daterangepicker').setStartDate(new Date(+param.d1)); }
                        if (param && param.d2) { $(dateInp).data('daterangepicker').setEndDate(new Date(+param.d2)); }




                    } else { console.error('dateInp') }



                }, 500)
            }


        }






    })



    $(searchContact).click(function(){
        this.value='';
        $(this).removeClass('disable');
        //
        changeScrollHeight('auto');
        idContact = null;
        contact.empty();
        searchContact.value = '';
        searchContact.placeholder = 'Найти контакт';
        searchContact.parentNode.style.display = 'block';
        searchContact.focus();
        searchRes.empty();
        getContacts(idProject);
        this.focus();
        //
    });
    $(searchProject).click(function(){
        this.value='';
        $(this).removeClass('disable');
        //
        changeScrollHeight('auto');
        idProject = null;
        project.empty();
        searchProject.value = '';
        searchProject.placeholder = 'Найти проект';
        searchProject.parentNode.style.display = 'block';
        searchProject.focus();
        searchRes.empty();
        getProjects();
        console.log(idContact);
        this.focus();
        //
    });

    $(document).mouseup(function(e){
        if (!$(searchRes).is(e.target) && $(searchRes).has(e.target).length === 0) searchRes.empty();
    });


    searchContact.onkeyup = function(event) {    
        var cur = searchRes.querySelector('li.active') || searchRes.querySelector('li');
        if (event.keyCode === 13) {
            var el = cur.querySelector('a');
            if (el) { el.click(); }
        } else if (event.keyCode === 40 || event.keyCode === 38) {
            event.preventDefault();
            if (searchRes.querySelectorAll('li').length) {
                cur.classList.remove('active');
                if (event.keyCode === 40) {
                    if (cur.nextSibling) { cur.nextSibling.classList.add('active'); } else { searchRes.querySelector('li').classList.add('active'); }
                } else if (event.keyCode === 38) {
                    if (cur.previousSibling) { cur.previousSibling.classList.add('active') } else { searchRes.querySelector('li').classList.add('active'); }
                }
            }
            return false;
        } else if (this.value.length > 0) {
            searchRes.empty();
            getContacts();
        }
    }
    searchProject.onkeyup = function(event) {
        var cur = searchRes.querySelector('li.active') || searchRes.querySelector('li');
        if (event.keyCode === 13) {
            var el = cur.querySelector('a');
            if (el) { el.click(); }
        } else if (event.keyCode === 40 || event.keyCode === 38) {
            event.preventDefault();
            if (searchRes.querySelectorAll('li').length) {
                cur.classList.remove('active');
                if (event.keyCode === 40) {
                    if (cur.nextSibling) { cur.nextSibling.classList.add('active'); } else { searchRes.querySelector('li').classList.add('active'); }
                } else if (event.keyCode === 38) {
                    if (cur.previousSibling) { cur.previousSibling.classList.add('active') } else { searchRes.querySelector('li').classList.add('active'); }
                }
            }
            return false;
        } else if (this.value.length > 0) {
            searchRes.empty();
            getProjects();
        }
    }



    assignee.onfocus = function() {
        //
        var it = this;

        if (!this.dataset.autocompleteOn) {
            app.modules.use('fnn-autocomplete')
                .then(function() {
                    let aCom = new fnnAutocomplete(it, {
                        source: function(term, cb) {
                            app.fetch(app.root + 'ajax/autocomplete.users.forQickAddTaskNew.php', { term: term, pid: idProject }).then(function(res) {
                                res.unshift({ id: 0, name: 'Не выбран', photo: 'assets/img/dummy.png', email: 'none' })
                                cb(res);
                            })
                        },
                        key: 'name',
                        limit: 5,
                        closeBtn: false,
                        render: function(data) {

                            return crEl('li',
                                new app.constructor.Avatar(data.photo, data.name, { width: 32, height: 32, c: 'img-circle avatar' }), data.name, crEl('br'), crEl('small', { s: 'opacity:0.5' }, data.email)
                            )


                        },
                        onSelect: function(res) {
							if (res.is_role == "1") {
								idAssignee = null;
								idRole = res.id;
							}else{
								idAssignee = res.id;
								idRole = null;
							}
                            it.style.backgroundImage = 'url(' + ( res.photo !== null && res.photo.length ? (app.server + res.photo) : (app.root + "assets/img/bukva/generate.php?width=30&height=30&b=" + res.name.charAt(0).toUpperCase())) + ')';

                            if (!idProject) {
                                searchProject.focus();
                                searchProject.value;
                            } else if(!idContact) {
                                searchContact.focus();
                                searchContact.value;
                            } else {
                                name.focus();
                            }

                        }
                    })

                    aCom.search('%');
                    it.select();
                    it.focus();
                    it.dataset.autocompleteOn = 1;
                })
        }
    }
    name.onkeydown = function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            desc.focus();
            return false;
        }

    }



    setTimeout(function() { searchContact.focus() }, 100);
    app.modules.use('eWysiwyg')
        .then(function() {

            var editor = new EWysiwyg(desc, addTaskWin.querySelector('.editor-toolbar'));
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
                            cb(crEl('a', { href: document.getElementById("linkUrl").value.trim() }, document.getElementById("linkText").value.trim()))
                            $("#editorLinkAddModal").modal('hide');
                            return false;
                        }
                    })
                    var a, b, link;
                }
            })
        });


}
