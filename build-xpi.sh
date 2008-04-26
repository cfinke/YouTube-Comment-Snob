rm -rf `find ./ -name ".DS_Store"`
rm -rf `find ./ -name "Thumbs.db"`
rm youtube-comment-snob.xpi
rm -rf .tmp_xpi_dir/

chmod -R 0777 youtube-comment-snob/

mkdir .tmp_xpi_dir/
cp -r youtube-comment-snob/* .tmp_xpi_dir/
rm -rf `find ./.tmp_xpi_dir/ -name ".svn"`

cd .tmp_xpi_dir/chrome/
zip -rq ../youtube-comment-snob.jar *
rm -rf *
mv ../youtube-comment-snob.jar ./
cd ../
zip -rq ../youtube-comment-snob.xpi *
cd ../
rm -rf .tmp_xpi_dir/
cp youtube-comment-snob.xpi ~/Desktop/