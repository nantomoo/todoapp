#!/usr/bin/perl
use strict;
use warnings;
use IO::Socket::INET;

my $port = $ENV{PORT} || 3456;

my $server = IO::Socket::INET->new(
    LocalPort => $port,
    Type      => SOCK_STREAM,
    Reuse     => 1,
    Listen    => 10,
) or die "Cannot start server: $!\n";

print "Server running on http://localhost:$port\n";
$| = 1;

while (my $client = $server->accept()) {
    my $request = '';
    while (my $line = <$client>) {
        $request .= $line;
        last if $line eq "\r\n";
    }

    my ($path) = $request =~ m{^GET (\S+) HTTP};
    $path //= '/';
    $path = '/index.html' if $path eq '' || $path eq '/';
    $path =~ s/[?#].*//;
    $path =~ s/\.\.//g;

    # Try demo/ subdirectory first, then cwd
    my $file;
    for my $candidate ("demo$path", ".$path") {
        if (-f $candidate) { $file = $candidate; last; }
    }

    if (defined $file) {
        my $ext = ($file =~ /\.(\w+)$/)[0] // '';
        my %types = (html => 'text/html; charset=utf-8', css => 'text/css', js => 'application/javascript', png => 'image/png', svg => 'image/svg+xml');
        my $ct = $types{$ext} // 'text/plain';
        open my $fh, '<:raw', $file or next;
        local $/;
        my $body = <$fh>;
        close $fh;
        print $client "HTTP/1.1 200 OK\r\nContent-Type: $ct\r\nContent-Length: " . length($body) . "\r\nConnection: close\r\n\r\n$body";
    } else {
        print $client "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nNot Found: $path";
    }

    close $client;
}
