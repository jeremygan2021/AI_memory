import { NextResponse } from 'next/server';

/**
 * 代理转发PDF文件，支持浏览器原生预览
 * GET /api/pdf?url=<encoded_pdf_url>
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pdfUrl = searchParams.get('url');
    const timestamp = searchParams.get('_t'); // 时间戳参数，用于避免缓存
    
    console.log('PDF代理请求:', { pdfUrl, timestamp });
    
    if (!pdfUrl) {
      return new NextResponse('缺少PDF URL参数', { status: 400 });
    }
    
    // 解码URL
    const decodedUrl = decodeURIComponent(pdfUrl);
    
    // 验证URL格式，确保是安全的URL
    try {
      new URL(decodedUrl);
    } catch (e) {
      return new NextResponse('无效的PDF URL', { status: 400 });
    }
    
    // 从云端获取PDF文件
    console.log('正在获取PDF文件:', decodedUrl);
    const pdfResponse = await fetch(decodedUrl);
    
    console.log('PDF响应状态:', pdfResponse.status, pdfResponse.statusText);
    
    if (!pdfResponse.ok) {
      console.error('获取PDF失败:', pdfResponse.status, pdfResponse.statusText);
      return new NextResponse(`获取PDF失败: ${pdfResponse.status}`, { 
        status: pdfResponse.status 
      });
    }
    
    // 获取PDF文件内容
    const pdfBuffer = await pdfResponse.arrayBuffer();
    
    // 从URL中提取文件名
    const urlObj = new URL(decodedUrl);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'document.pdf';
    
    // 记录原始响应头
    console.log('原始响应头:', Object.fromEntries(pdfResponse.headers.entries()));
    
    // 设置正确的Content-Type和Content-Disposition头
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    // 使用inline并指定文件名，确保浏览器预览而不是下载
    // 使用UTF-8编码文件名，确保非ASCII文件名正确显示
    const encodedFilename = encodeURIComponent(filename);
    const contentDisposition = `inline; filename="${filename}"; filename*=UTF-8''${encodedFilename}`;
    headers.set('Content-Disposition', contentDisposition);
    
    console.log('设置的响应头:', {
      'Content-Type': 'application/pdf',
      'Content-Disposition': contentDisposition
    });
    
    // 添加缓存控制头
    headers.set('Cache-Control', 'public, max-age=3600');
    
    // 添加其他必要的HTTP头，确保浏览器预览而不是下载
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Length', pdfBuffer.byteLength.toString());
    headers.set('Content-Transfer-Encoding', 'binary');
    headers.set('X-Content-Type-Options', 'nosniff');
    
    // 添加安全相关头
    headers.set('Content-Security-Policy', "default-src 'none'; script-src 'none'; plugin-types application/pdf; object-src 'none';");
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // 返回PDF文件内容
    console.log('返回PDF文件内容，大小:', pdfBuffer.byteLength, '字节');
    const response = new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    });
    
    return response;
  } catch (error) {
    console.error('PDF代理转发错误:', error);
    console.error('错误堆栈:', error.stack);
    return new NextResponse(`服务器错误: ${error.message}`, { status: 500 });
  }
}