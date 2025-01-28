#!/bin/bash
mkdir -p data
pushd data
wget https://github.com/Zettelkasten-Method/10000-markdown-files/archive/refs/heads/master.zip
unzip master.zip
mv 10000-markdown-files-master 10000files
popd
