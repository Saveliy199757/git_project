<?php

if (strlen($_SERVER['DOCUMENT_ROOT']) > 0) die();

include(__DIR__ . '/../blocks/db.php');

$ldapuri = 'ldap://10.10.1.4:3268';
$ldaprdn = 'ptpa\\forumadmin';
$ldappass = 'gWxv7vj';
$dn = 'dc=ptpa, dc=ru';
$fields = ['cn', 'mail', 'samaccountname'];

$notneeded = [
    'apache',
    'root',
    'archive',
    'back_user',
    'docs',
    'doverie',
    'forumadmin',
    'export',
    'energo_uchet',
    'GSH',
    'GSH_TPA-MAIL',
    'Gunfather',
    'itilium',
    'rzaynkina_ii1',
    'home',
    'ILS_ANONYMOUS_USER',
    'itb-http',
    'Itilium',
    'IUSR_TPA-FILES',
    'IUSR_TPA-MAIL',
    'IWAM_TPA-FILES',
    'IWAM_TPA-MAIL',
    'krbtgt',
    'kyocera_scan',
    'mashsteel_mail_usr',
    'masterform',
    'ogk_scan',
    'oktest',
    'mash_pers',
    'PTPA$',
    'reserv',
    'sales',
    'sysop',
    'TsInternetUser',
    'test_user1',
    'test_user',
    'testokm',
    'postmaster',
    'adm1',
    'adm2',
    'aiis_kue',
    'aiis_kueptpa',
    'ekoder',
    'disp',
    'teh2',
    ''
];

$ldapconn = ldap_connect($ldapuri) or die('LDAP-URI некорректен');

$ldapbind = ldap_bind($ldapconn, $ldaprdn, $ldappass);

if ($ldapbind) {
    echo 'LDAP-привязка успешна';
} else {
    echo 'LDAP-привязка не удалась';
}

$query = 'DROP PROCEDURE IF EXISTS update_or_insert;';
$query .=
    "CREATE PROCEDURE update_or_insert(name VARCHAR(80), email VARCHAR(150))

	BEGIN

		DECLARE totalOrder INT DEFAULT 0;
        DECLARE id INT DEFAULT 0;
    
        SELECT COUNT(*) 
        INTO totalOrder
        FROM `contacts`
        WHERE `contacts`.`email` LIKE email;
        
        IF totalOrder = 1 THEN
            SELECT `contacts`.`id` INTO id FROM `contacts` WHERE `contacts`.`email` LIKE email AND `contacts`.`name` LIKE name;
            IF id = 0 THEN
            	UPDATE `contacts` SET `contacts`.`note` = CONCAT('Старое ФИО: ', `contacts`.`name`), `contacts`.`name` = name
            		WHERE `contacts`.`email` = email;
            ELSE
            	SELECT 'Идентичное имя';
            END IF;
        ELSEIF totalOrder > 1 THEN
        	SELECT 'pass';
        ELSE
        	INSERT INTO `contacts` (`name`, `email`)
            	VALUES(name, email);
        END IF;

    END;";

if (!$mysqli->multi_query($query)) {
    var_dump($mysqli->error); // FIXME: удалить этот var_dump
    $mysqli->close();
    ldap_close($ldapconn);
    die();
}

setAccountsFromLDAP($ldapconn, $dn, $fields, $notneeded, $mysqli);

$mysqli->close();
ldap_close($ldapconn);

function setAccountsFromLDAP($ldapconn, $dn, $fields, $notneeded, $mysqli)
{

    for ($i = 97; $i <= 122; $i++) {

        $letter = chr($i);
        $searchFilter = '(&(objectClass=user)(objectCategory=person)(samaccountname=' . $letter . '*))';

        $searchResult = ldap_search($ldapconn, $dn, $searchFilter, $fields);

        if (ldap_count_entries($ldapconn, $searchResult)) {

            $items = ldap_get_entries($ldapconn, $searchResult);

            foreach ($items as $item) {
                $cn = iconv("Windows-1251", "UTF-8", $item['cn'][0]);
                $samaccountname = iconv("Windows-1251", "UTF-8", $item['samaccountname'][0]);
                $mail = isset($item['mail'][0]) ? iconv("Windows-1251", "UTF-8", $item['mail'][0]) : 'help@ptpa.ru';
                if (!in_array($samaccountname, $notneeded)) {
                    free_all_results($mysqli);
                    $myQuery = "call update_or_insert('{$cn}', '{$mail}');";
                    echo "\n" . 'sma: ' . $samaccountname . ' Name: ' . $cn . ' mail: ' . $mail;
                    if (!$mysqli->query($myQuery)) {
                        var_dump($mysqli->error); // FIXME: удалить этот var_dump
                        $mysqli->close();
                        ldap_close($ldapconn);
                        die();
                    }
                }
            }
        }
    }
}

function free_all_results(mysqli $dbCon)
{
    do {
        if ($res = $dbCon->store_result()) {
            $res->fetch_all(MYSQLI_ASSOC);
            $res->free();
        }
    } while ($dbCon->more_results() && $dbCon->next_result());
}
