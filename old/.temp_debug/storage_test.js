
async function testStorage() {
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('Supabase client not found');
        return;
    }

    const testFile = new Blob(['test'], { type: 'text/plain' });
    const fileName = `test_${Date.now()}.txt`;

    console.log('Testing upload to "winner-photos" bucket...');
    const { data, error } = await supabase.storage
        .from('winner-photos')
        .upload(fileName, testFile);

    if (error) {
        console.error('Upload failed:', error);
        alert('Storage Test Failed: ' + error.message);
    } else {
        console.log('Upload successful:', data);
        const { data: urlData } = supabase.storage
            .from('winner-photos')
            .getPublicUrl(fileName);
        console.log('Public URL:', urlData.publicUrl);
        alert('Storage Test Successful! Check console for URL.');
    }
}
window.testStorage = testStorage;
console.log('Storage tester injected. Run window.testStorage() in console.');
