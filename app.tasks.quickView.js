if(!app.tasks){app.tasks={}}
app.tasks.quickView = function(data){
	if(typeof(data)==='number'){
		app.fetch( app.root + 'ajax/tasks_headers_new.php', {id:data}).then(function(res){f(res[0])})
	} else if(typeof(data)==='object' && data.id>0){
		f(data)
	} else {
		app.error('Bad params');
		return false;
	}
//$("#taskQuickViewModal").remove()
	function f(d){




		var taskDom = new app.constructor.Task(d);

			taskDom.classList.add('list-item--open');
			taskDom.classList.add('task-one');

		 taskDom.querySelector('.list-item__header-subject').removeEventListener("click", taskDom.querySelector('.list-item__header-subject').onclick, false);
		 taskDom.querySelector('.list-item__header-subject').onclick = null;

			 //taskDom.querySelector('.list-item__header-subject').onclick = function(event){ event.preventDefault(); return;}





		app.modal({
			body:taskDom,
			id:'taskQuickViewModal',
			modalClass:'modal-lg',
			container: app.el.pageContent,
			width:$(window).width()*0.9
		}).then((id)=>{
			let mod = document.getElementById(id);
			app.tasks.oneToList(d.id, function(){
				let b = mod.querySelector('.list-item__body-container');
				b.style.display = "";
				b.animate('fadeIn')
			}, mod);
			app.timer.init()

			let tb = mod.querySelector('.list-item__header-toolbar')
			tb.prepend(crEl('li',
				crEl('a',{href:nav(), title:'Обновить', onclick: function(){
					app.tasks.quickView(+d.id)
				}}, new Icon('refresh'))
			))
			mod.querySelector('.task-edit-btn').title = 'Редактировать';
			//mod.append(crEl('span', {s:'position:absolute; top:-20px; left:0'}, d.id))

			[].forEach.call(mod.querySelectorAll('.list-item__header-toolbar .dropdown-menu a:not(.printReq) '), function(a){
				a.addEventListener('click',(e) => {
				  $("#"+id).modal('hide');
				  $("#"+id).remove()
				});
			});



			mod.querySelector('.task-edit-btn').onclick = function(event){
				event.preventDefault();
				let taskEditContainer = crEl('div',{c:'panel-body'}),
					iEd = crEl('div',
						crEl('div',{s:'padding:12px 16px; background:#f8f8f8'},
							new Btn({c:'btn-white btn-xs pull-right'},'К задаче',function(){
								mod.querySelector('.task').style.display ="";
								mod.querySelector('.task').animate('fadeIn')
								this.parentNode.parentNode.animate('fadeOut')
								this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode)
							}),
							crEl('h2',{c:'m-n'},'Редактирование задачи ' , crEl('small',{id:'taskEditNameTitle'},'#' + d.id))
						),
						taskEditContainer
					);
				let bod = document.getElementById(id+'_body').append(iEd)
				let t = mod.querySelector('.task');

				taskEditContainer.append('Loading...')
				app.modules.use('app.tasks.params').then(()=>{
					app.tasks.params(d.id, function(){app.msg('Edited!!!!!!!!!!!!')}, taskEditContainer)
								//	t.animate('fadeOut');

				t.style.display ='none';
					iEd.animate('fadeIn')
				})


				return false;




			}

			let btns = crEl({c:'quick-view-toolbar'},
				new Btn(new Icon('close'),{title:'Закрыть', c:'btn-white'}, function(){ $('#' + id).modal('hide') }),
				new Btn(new Icon('expand'),{title:'Открыть в текущем окне', c:'btn-white'}, function(){
					app.navigate('tasks/'+d.id)
				}),
				new Btn(new Icon('external-link'),{title:'Открыть в новом окне', c:'btn-white'}, function(){
					app.navigate('tasks/'+d.id, true)
				})
			);

			tb.append(btns);

			tb.appendChild(crEl('div',{c:'quick-view-id'},'#' + d.id))
			btns.animate('slideInLeft')


		})

		var x = 0;

		$('#taskQuickViewModal').on('hide.bs.modal', function(e){
			if(app.currentEditind){

				 app.msg('Возможно вы что-то написали но забыли сохранить?');

				 e.preventDefault();
				 e.stopImmediatePropagation();
				 return false;
			}

		});



	}
}
