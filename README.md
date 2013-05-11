ProjectMonitor
==============

A Node Module to restart your project automatically if any file has changed.

=============

This used `Cluster` and `fs.watchFile` module in NODE api, but they are unstable ,so use it carefully pls.

Ｈow does it works?

1.  Get all files and folds in given path.
2.  Then wath them by `fs.watchFile` , when it changed , I will catch them .and callback a method with an `EventEmitter`
3.  Restart App : I use `cluster` to folk 2 process at least , and disconnect the first one when file changed.

As you know , such as a http server, it must be running in a child process. so you can't get the server instance in master,
so I send messages from master to fork. to tell child what should him do .


Note:
It only is a Experimental project . I will improve and perfect it soon.
