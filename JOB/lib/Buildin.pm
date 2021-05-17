package Buildin;

use warnings;
use strict;
use File::Temp;
use MYDan;
use Util;
use LWP::UserAgent;
use JSON;
use Temp;

sub new
{
    my ( $class, @node ) = @_;
    bless +{ node => \@node }, ref $class || $class;
}

sub run
{
    my ( $this, %run ) = @_;

    my @node = @{$this->{node}};
    my %result = map{ $_ => '' }@node;

    my ( $cont, $argv ) = map{ $run{query}{argv}[0]{$_} }qw( cont argv );
    unless( $cont )
    {
        print "cont null\n";
        return %result;
    }

    my ( $timeout, $ticketid, $ticketfile ) = @run{qw( timeout sudo )};
    $timeout ||= 60;
    $ticketfile ||= 0;

    if( $ticketid ) # != 0
    {
        my %env = Util::envinfo( qw( appname appkey ) );
        my $ua = LWP::UserAgent->new;
        $ua->default_header( %env );

        my $res = $ua->get( "http://api.ci.open-c3.org/ticket/$ticketid?detail=1" );

        unless( $res->is_success )
        {
            #TODO 确认上层调用是否捕获这个die
            die "get ticket fail";
        }

        my $data = eval{JSON::from_json $res->content};
        unless ( $data->{stat} && $data->{data} && $data->{data}{ticket} && $data->{data}{ticket}{JobBuildin} ) {
            #TODO 确认上层调用是否捕获这个die
            die "call ticket result". $data->{info} || '';
        }

        $ticketfile = Temp->new( chmod => 0600 )->dump( $data->{data}{ticket}{JobBuildin} );
    }

    my $build;
    if( $cont =~ s/^#!([a-zA-Z0-9_]+)\n{0,1}// )
    {
        $build = $1;
    }
    else
    {
        print "cont no buildin info\n";
        return %result;
    }


    my $JOBUUID = $run{jobuuid} ? "JOBUUID=$run{jobuuid}" : '';

    my $CONFIGPATH = '';
    if( length $cont )
    {
        my ( $TEMP, $tempfile ) = File::Temp::tempfile();
        print $TEMP $cont;
        close $TEMP;
        $CONFIGPATH = "CONFIGPATH=$tempfile";
    }


    my $path = "$MYDan::PATH/JOB/buildin/$build";
    unless( -e $path )
    {
        print "nofind this buildin code\n";
        return %result;
    }

    my $nodes = join ',', sort @node;
    my $cmd = "NODE='$nodes' TIMEOUT=$timeout TICKETFILE=$ticketfile TASKUUID=$run{taskuuid} $JOBUUID $CONFIGPATH $path $argv";

    print "cmd:$cmd\n";
    unless( $cmd =~ /^[a-zA-Z0-9\.\-_ '=,\/:"]+$/ )
    {
        print "cmd format error\n";
        return %result;
    }

    my @x = `$cmd`;
    chomp @x;
    map
    {
        if( $_ =~ /^([a-zA-Z0-9\-_\.]+):(.+)$/ )
        {
            my ( $n, $c ) = ( $1, $2 );
            $result{$n} .= $c if defined $result{$n};
        }
    }@x;

    map{ $result{$_} .= "--- 0\n" if $result{$_} eq 'ok'  }@node;
    return %result;
}

1;
