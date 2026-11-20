"""Spectral balance per section + loudness of public/cody-track.wav (numpy only)."""
import numpy as np, wave, sys
w=wave.open(sys.argv[1] if len(sys.argv)>1 else 'public/cody-track.wav'); sr=w.getframerate(); n=w.getnframes()
x=np.frombuffer(w.readframes(n),dtype=np.int16).reshape(-1,2).astype(np.float64)/32768
mono=x.mean(1); BEAT=60/132
def band_db(a,b,lo,hi):
    seg=mono[int(a*BEAT*sr):int(b*BEAT*sr)]
    S=np.abs(np.fft.rfft(seg*np.hanning(len(seg))))**2; f=np.fft.rfftfreq(len(seg),1/sr)
    return 10*np.log10(S[(f>=lo)&(f<hi)].sum()/len(seg)+1e-12)
bands=[(20,60),(60,120),(120,250),(250,500),(500,1000),(1000,2000),(2000,4000),(4000,8000),(8000,16000)]
print('section      '+' '.join(f'{lo:>5}-{hi:<5}' for lo,hi in bands)+'   rms')
for name,a,b in [('stomps',1,5),('build',5,13),('riser',13,16.5),('drop',17,25),('wall',25,29),('final',29,33)]:
    vals=[band_db(a,b,lo,hi) for lo,hi in bands]; ref=max(vals)
    seg=x[int(a*BEAT*sr):int(b*BEAT*sr)]
    print(f'{name:<12} '+' '.join(f'{v-ref:>11.1f}' for v in vals)+f'  {20*np.log10(np.sqrt((seg**2).mean())):6.1f}')
print('corr L/R %.2f'%np.corrcoef(x[:,0],x[:,1])[0,1],' peak %.3f'%np.abs(x).max(),' rms dB %.1f'%(20*np.log10(np.sqrt((x**2).mean()))))
