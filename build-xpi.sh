rm -rf `find ./ -name ".DS_Store"`
rm -rf `find ./ -name "Thumbs.db"`
rm slashdotter.xpi
rm -rf .tmp_xpi_dir/

chmod -R 0777 slashdotter/

mkdir .tmp_xpi_dir/
cp -r slashdotter/* .tmp_xpi_dir/

cd .tmp_xpi_dir/chrome/
zip -rq ../slashdotter.jar *
rm -rf *
mv ../slashdotter.jar ./
cd ../
zip -rq ../slashdotter.xpi *
cd ../
rm -rf .tmp_xpi_dir/
