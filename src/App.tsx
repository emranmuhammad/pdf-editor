import PDFCanvas from './PDFCanvas';
import pdf from './Version_3.3.1.4_MyLead_Release_Note_20240324141229.pdf';

const App = () => {
  const pdfUrl = 'https://example.com/path/to/your/pdf.pdf';

  return (
    <div style={{ margin: 'auto' }}>
      <PDFCanvas pdfUrl={pdf} />
    </div>
  );
};

export default App;
