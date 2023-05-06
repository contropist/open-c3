package api::cmdbmanage::huawei;
use Dancer ':syntax';
use Dancer qw(cookie);
use Encode qw(encode);

use JSON qw();
use POSIX;
use MIME::Base64;
use api;
use Format;
use Encode qw(decode encode);
use OPENC3::Crypt;

my @cryptcol = qw( secretkey );
my $crypt; BEGIN{ $crypt = OPENC3::Crypt->new(); };

=pod

CMDB/云帐号管理/华为云/获取列表

=cut

get '/cmdbmanage/account/huawei' => sub {
    my $pmscheck = api::pmscheck( 'openc3_agent_root' ); return $pmscheck if $pmscheck;

    my @col = qw( id accountname accesskey secretkey project region iamid note edit_user edit_time );
    my $r = eval{ 
        $api::mysql->query( 
            sprintf( "select %s from openc3_device_account_huawei", join( ',', map{"`$_`"}@col)), \@col )};

    for my $x ( @$r ) { map{ $x->{$_} = $crypt->decode( $x->{$_} ) if $x->{$_} }@cryptcol; }

    return $@ ? +{ stat => $JSON::false, info => $@ } : +{ stat => $JSON::true, data => $r };
};

=pod

CMDB/云帐号管理/华为云/获取详情

=cut

get '/cmdbmanage/account/huawei/:id' => sub {
    my $param = params();
    my $error = Format->new( 
        id => qr/^\d+$/, 1,
    )->check( %$param );

    return  +{ stat => $JSON::false, info => "check format fail $error" } if $error;
    my $pmscheck = api::pmscheck( 'openc3_agent_root' ); return $pmscheck if $pmscheck;

    my @col = qw( id accountname accesskey secretkey project region iamid note edit_user edit_time );
    my $r = eval{ 
        $api::mysql->query( 
            sprintf( "select %s from openc3_device_account_huawei where id='$param->{id}'", join( ',', map{"`$_`"}@col)), \@col )};

    for my $x ( @$r ) { map{ $x->{$_} = $crypt->decode( $x->{$_} ) if $x->{$_} }@cryptcol; }

    return $@ ? +{ stat => $JSON::false, info => $@ } : +{ stat => $JSON::true, data => $r->[0] };
};

=pod

CMDB/云帐号管理/华为云/添加或编辑帐号

=cut

post '/cmdbmanage/account/huawei' => sub {
    my $param = params();
    my $error = Format->new( 
        id           => qr/^\d+$/, 0,
        accountname  => [ 'mismatch', qr/'/ ], 1,
        accesskey    => [ 'mismatch', qr/'/ ], 1,
        secretkey    => [ 'mismatch', qr/'/ ], 1,
        project      => [ 'mismatch', qr/'/ ], 1,
        region       => [ 'mismatch', qr/'/ ], 1,
        iamid        => [ 'mismatch', qr/'/ ], 1,
        note         => [ 'mismatch', qr/'/ ], 1,
    )->check( %$param );

    return  +{ stat => $JSON::false, info => "check format fail $error" } if $error;

    my $pmscheck = api::pmscheck( 'openc3_agent_root' ); return $pmscheck if $pmscheck;

    my $user = $api::sso->run( cookie => cookie( $api::cookiekey ), map{ $_ => request->headers->{$_} }qw( appkey appname ) );

    my $title = $param->{id} ? "EDIT" : "ADD";
    eval{ $api::auditlog->run( user => $user, title => "$title CMDB Account Huawei", content => "name:$param->{name}" ); };
    return +{ stat => $JSON::false, info => $@ } if $@;

    map{ $param->{$_} = $crypt->encode( $param->{$_} ) if $param->{$_} }@cryptcol;

    my $r = eval{ 
        $api::mysql->execute(
           $param->{id}
              ? "update openc3_device_account_huawei set accountname='$param->{accountname}',accesskey='$param->{accesskey}',`secretkey`='$param->{secretkey}',project='$param->{project}',region='$param->{region}',iamid='$param->{iamid}',note='$param->{note}',edit_user='$user' where id='$param->{id}'"
              : "insert into openc3_device_account_huawei (`accountname`,`accesskey`,`secretkey`,`project`,`region`,`iamid`,`note`,`edit_user`)values( '$param->{accountname}','$param->{accesskey}','$param->{secretkey}','$param->{project}', '$param->{region}','$param->{iamid}','$param->{note}','$user')"
         )
    };

    return $@ ? +{ stat => $JSON::false, info => $@ } : +{ stat => $JSON::true };
};

=pod

CMDB/云帐号管理/华为云/删除帐号

=cut

del '/cmdbmanage/account/huawei/:id' => sub {
    my $param = params();
    my $error = Format->new( 
        id => qr/^\d+$/, 1,
    )->check( %$param );

    return  +{ stat => $JSON::false, info => "check format fail $error" } if $error;
    my $pmscheck = api::pmscheck( 'openc3_agent_root' ); return $pmscheck if $pmscheck;

    my $user = $api::sso->run( cookie => cookie( $api::cookiekey ), map{ $_ => request->headers->{$_} }qw( appkey appname ) );

    eval{ $api::auditlog->run( user => $user, title => 'DEL CMDB Account Huawei', content => "ID:$param->{id}" ); };
    return +{ stat => $JSON::false, info => $@ } if $@;

    my $r = eval{ $api::mysql->execute( "delete from openc3_device_account_huawei where id='$param->{id}'")};

    return $@ ? +{ stat => $JSON::false, info => $@ } : +{ stat => $JSON::true, data => $r };
};

true;
