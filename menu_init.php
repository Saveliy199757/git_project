<?php
	$res = array("user"=>array(),"menu"=>array());
	include_once("../blocks/base_function.php");
	include_once('../blocks/db.php');
	
	$q = $mysqli->query("SELECT timetables.*, users.id, users.name, users.email, users.photo, users.guest, users.gservice, users.admin, users.require_change_psw FROM users LEFT JOIN timetables ON timetables.id=users.id_timetable WHERE users.id=".un()."  LIMIT 1");
	if(!$q){die(json_encode(array("error"=>$mysqli->error)));}
	$res['user'] = $q -> fetch_assoc();
	
	$q = $mysqli->query("SELECT access_parts.id, access_parts.name, access_parts.desc, access_parts.hash, access_parts.link, access_parts.icon,access_parts.m_icon, access_parts.counter_dom_id
						 FROM access_parts LEFT JOIN access_user_to_parts ON(access_user_to_parts.id_part = access_parts.id) WHERE access_user_to_parts.id_user=".un()." ORDER BY access_parts.order_index ");
	if(!$q){die(json_encode(array("error"=>$mysqli->error)));}
	while ( $r = $q -> fetch_assoc() ){$res['menu'][] = $r;}
	
	
	$q = $mysqli->query("SELECT id FROM user_notification_task WHERE id_user=".un()." LIMIT 1");
	if(!$q){die(json_encode(array("error"=>$mysqli->error)));}
	$res['user']['subs'] = $q->num_rows;
	


	$un = isset($_COOKIE["u1Bo31c6b12"])?$_COOKIE["u1Bo31c6b12"]:0;
	if(isset($_COOKIE["uid"])){$un = $_COOKIE["uid"];}
	if(!($un>0)){
		try{
			if(!isset($_SESSION)){ session_start(); }
			if(isset($_SESSION['un'])){ $un = $_SESSION['un'];} 
		} catch (Exception $e){
			die(json_encode(array("error"=>"User is not defined")));
		}
	}
	

	$hash = $_COOKIE["hash"];
	/*$q = $mysqli->query("SELECT id FROM users WHERE id={$un} AND sequreHashe='{$hash}'");
	if(!$q || $q->num_rows===0){
		


		die(json_encode(array('error'=>'Пожалуйста авторизуйтесь','auth'=>true)));
	}*/
	
	
	$q = $mysqli->query("SELECT id, UNIX_TIMESTAMP(date_last_visit) FROM user_tokens WHERE token='{$hash}' AND id_user={$un} LIMIT 1");
	if($q && $q->num_rows===1){
		$r = $q->fetch_row();
		$res['from_tokens'] = $r;
		if( !($r[1]>0) ){
			$ip = isset($_SERVER['HTTP_CLIENT_IP'])?$_SERVER['HTTP_CLIENT_IP']:isset($_SERVER['HTTP_X_FORWARDED_FOR'])?$_SERVER['HTTP_X_FORWARDED_FOR']:$_SERVER['REMOTE_ADDR'];
			if(empty($ip)){$ip="127.0.0.1";}
			$q = $mysqli -> query("
				UPDATE `user_tokens` SET 
					`date_create`=NOW(),
					`ip_addres`=INET_ATON('{$ip}'),
					`user_agent`='".$_SERVER['HTTP_USER_AGENT']."',
					`date_last_visit`=NOW()
				WHERE id=".$r[0]."
			");
			if(!$q){die(json_encode(array('error'=>'User tokens update 1 error: '.$mysqli->error)));}
		} else {
			$ip = isset($_SERVER['HTTP_CLIENT_IP'])?$_SERVER['HTTP_CLIENT_IP']:isset($_SERVER['HTTP_X_FORWARDED_FOR'])?$_SERVER['HTTP_X_FORWARDED_FOR']:$_SERVER['REMOTE_ADDR'];
			if(empty($ip)){$ip="127.0.0.1";}
			$q = $mysqli -> query("
				UPDATE `user_tokens` SET 
					`ip_addres`=INET_ATON('{$ip}'),
					`user_agent`='".$_SERVER['HTTP_USER_AGENT']."',
					`date_last_visit`=NOW()
				WHERE id=".$r[0]."
			");
			if(!$q){die(json_encode(array('error'=>'User tokens update 2 error: '.$mysqli->error)));}	
		} 
	} else {
		die(json_encode(array('error'=>'Пожалуйста авторизуйтесь','auth'=>true)));
	}
	
	
	

	echo json_encode($res);
	/**//**/
?>

