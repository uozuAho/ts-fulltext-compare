#!/bin/bash
mkdir -p data/md10000
pushd data/md10000
wget https://github.com/Zettelkasten-Method/10000-markdown-files/archive/refs/heads/master.zip
unzip master.zip
mv 10000-markdown-files-master temp
mv "temp/10000 markdown files" files
popd
